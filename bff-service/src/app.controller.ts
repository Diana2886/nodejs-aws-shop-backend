import { Controller, All, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import 'dotenv/config';
import * as NodeCache from 'node-cache';

@Controller()
export class AppController {
  private productCache: NodeCache;

  constructor(private readonly appService: AppService) {
    this.productCache = new NodeCache({ stdTTL: 120 });
  }

  @All('/*')
  async proxyRequest(@Req() req, @Res() res) {
    console.log('originalUrl', req.originalUrl);
    console.log('method', req.method);
    console.log('body', req.body);

    const recipient = req.originalUrl.split('/')[1];
    console.log('recipient', recipient);

    if (recipient === 'products') {
      const cachedProducts = this.productCache.get('products');
      if (cachedProducts) {
        console.log('Retrieving products from cache');
        return res.json(cachedProducts);
      }
    }

    const recipientURL = process.env[recipient];
    console.log('recipientURL', recipientURL);

    if (recipientURL) {
      try {
        const axiosConfig = {
          method: req.method,
          url: `${recipientURL}${req.originalUrl}`,
          ...(Object.keys(req.body || {}).length > 0 && { data: req.body }),
          headers: {
            Authorization: req.headers['authorization'],
          },
        };

        console.log('axiosConfig: ', axiosConfig);

        const response = await axios(axiosConfig);

        if (recipient === 'products') {
          this.productCache.set('products', response.data);
        }

        console.log('response from recipient', response.data);
        res.json(response.data);
      } catch (error) {
        console.log('some error: ', JSON.stringify(error));

        if (error.response) {
          const { status, data } = error.response;
          res.status(status).json(data);
        } else {
          res.status(500).json({ error: error.message });
        }
      }
    } else {
      res.status(502).json({ error: 'Cannot process request' });
    }
  }
}
