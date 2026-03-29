import { Global, Module } from '@nestjs/common';
import { HttpProvider } from 'src/providers/http/http.provider';
import { KickboxProvider } from './kickbox/kickbox.provider';

@Global()
@Module({
    providers: [HttpProvider, KickboxProvider],
    exports: [HttpProvider, KickboxProvider],
})
export class ProvidersModule { }