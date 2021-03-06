import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../role/decorators/role.decorator';
import { BookService } from './book.service';
import { CreateBookDto, ReadBookDto, UpdateBookDto } from './dto';
import { RoleType } from '../role/roleType.enum';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../role/guards/role.guard';
import { GetUser } from '../auth/user.decorator';

@Controller('book')
export class BookController {
    constructor( private readonly _bookService: BookService ) {}

    @Get(':id')
    getBook( @Param( 'id', ParseIntPipe ) id: number ): Promise<ReadBookDto> {
        return this._bookService.get( id );
    }

    @Get('author/:authorId')
    getBooksByAuthor( @Param( 'authorId', ParseIntPipe ) authorId: number ): Promise<ReadBookDto[]> {
        return this._bookService.getBooksByAuthor( authorId );
    }

    @Get()
    getBooks(): Promise<ReadBookDto[]> {
        return this._bookService.getAll();
    }

    @Post()
    @Roles( RoleType.AUTHOR ) 
    @UseGuards( AuthGuard(), RoleGuard )
    createBook( @Body() role: Partial<CreateBookDto> ): Promise<ReadBookDto> {
        return this._bookService.create( role );
    }

    @Post()
    @Roles( RoleType.AUTHOR )
    @UseGuards( AuthGuard(), RoleGuard )
    createBookByAuthor( @Body() role: Partial<CreateBookDto>, @GetUser('id') authorId: number ) {
        return this._bookService.createByAuthor( role, authorId );
    }

    @Patch(':id')
    updateBook( @Param('id', ParseIntPipe ) id: number, @Body() role: Partial<UpdateBookDto>, @GetUser('id') authorId: number ) {
        return this._bookService.update( id, role, authorId );
    }

    @Delete(':id')
    deleteBook( @Param('id', ParseIntPipe ) id: number ): Promise<void> {
        return this._bookService.delete( id );
    }
}
