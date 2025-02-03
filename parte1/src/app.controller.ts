import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

@Controller()
export class AppController {
  @Get()
  getHome(@Res() res: Response) {
    // Acessa a pasta 'public' raiz do projeto
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
  }
}
