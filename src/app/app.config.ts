import { ApplicationConfig }             from '@angular/core';
import { provideRouter, withRouterConfig }                 from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes }           from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideHttpClient(
    ),
  ],
};