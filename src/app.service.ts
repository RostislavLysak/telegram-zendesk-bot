import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}
  async getHello() {
    return 'Zendesk server bot is working fine.';
  }
}
