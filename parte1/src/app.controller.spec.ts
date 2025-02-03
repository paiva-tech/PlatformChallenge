import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Response } from 'express';
import * as path from 'path';

describe('AppController', () => {
  let appController: AppController;
  let res: Response;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);

    // Mock do objeto Response
    res = {
      sendFile: jest.fn(),
    } as any;
  });

  describe('getHome', () => {
    it('should serve the index.html file', () => {
      // Chama o método getHome que usa res.sendFile
      appController.getHome(res);

      // Verifica se o sendFile foi chamado com o caminho correto
      const expectedPath = path.join(__dirname, '..', '..', 'public', 'index.html');
      expect(res.sendFile).toHaveBeenCalledWith(expectedPath);
    });
  });

  // Ajuste para usar caminho relativo à raiz do projeto no teste
  describe('getHome with adjusted path', () => {
    it('should serve the index.html file correctly', () => {
      // Ajuste no caminho para garantir que ele aponte para a raiz do projeto
      const adjustedPath = path.resolve(__dirname, '..', '..', 'public', 'index.html');
      appController.getHome(res);

      // Verifica se o sendFile foi chamado com o caminho ajustado
      expect(res.sendFile).toHaveBeenCalledWith(adjustedPath);
    });
  });
});
