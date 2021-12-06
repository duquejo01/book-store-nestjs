import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {

    constructor( private readonly _authService: AuthService ) {}
    
    @Post('/signup')
    @UsePipes( ValidationPipe ) // Verify the class-validator custom validations are fine.
    async signup( @Body() signupDto: SignupDto ) {
        return this._authService.signup( signupDto );
    }

    @Post('/signin')
    @UsePipes( ValidationPipe )
    async signin( @Body() signinDto: SigninDto ) {
        return this._authService.singin( signinDto );
    }
}