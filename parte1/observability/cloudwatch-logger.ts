import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, CreateLogGroupCommand, DescribeLogStreamsCommand } from "@aws-sdk/client-cloudwatch-logs";

const REGION = process.env.AWS_REGION || "us-east-1";
const LOG_GROUP_NAME = process.env.CLOUDWATCH_LOG_GROUP || "digai-logs";
const LOG_STREAM_NAME = process.env.CLOUDWATCH_LOG_STREAM || "digai-stream";

const cloudWatchClient = new CloudWatchLogsClient({ region: REGION });

async function ensureLogGroupAndStream() {
  try {
    await cloudWatchClient.send(new CreateLogGroupCommand({ logGroupName: LOG_GROUP_NAME }));
  } catch (error: any) {
    if (error.name !== "ResourceAlreadyExistsException") {
      console.error("Erro ao criar o Log Group:", error);
    }
  }

  try {
    await cloudWatchClient.send(new CreateLogStreamCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamName: LOG_STREAM_NAME,
    }));
  } catch (error: any) {
    if (error.name !== "ResourceAlreadyExistsException") {
      console.error("Erro ao criar o Log Stream:", error);
    }
  }
}

async function getSequenceToken() {
  try {
    const response = await cloudWatchClient.send(
      new DescribeLogStreamsCommand({ logGroupName: LOG_GROUP_NAME, logStreamNamePrefix: LOG_STREAM_NAME })
    );
    return response.logStreams?.[0]?.uploadSequenceToken;
  } catch (error) {
    console.error("Erro ao obter sequence token:", error);
    return undefined;
  }
}

let sequenceToken: string | undefined;

export async function logToCloudWatch(message: string) {
  await ensureLogGroupAndStream();

  if (!sequenceToken) {
    sequenceToken = await getSequenceToken();
  }

  const logEvents = [
    {
      message: `${new Date().toISOString()} - ${message}`,
      timestamp: Date.now(),
    },
  ];

  try {
    const params = {
      logEvents,
      logGroupName: LOG_GROUP_NAME,
      logStreamName: LOG_STREAM_NAME,
      sequenceToken,
    };

    const response = await cloudWatchClient.send(new PutLogEventsCommand(params));
    sequenceToken = response.nextSequenceToken;
  } catch (error: any) {
    if (error.name === "InvalidSequenceTokenException") {
      sequenceToken = await getSequenceToken();
      return logToCloudWatch(message);
    }
    console.error("Erro ao enviar log para o CloudWatch:", error);
  }
}
