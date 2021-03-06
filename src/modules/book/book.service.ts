import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookRepository } from './book.repository';
import { UserRepository } from '../user/user.repository';
import { plainToClass } from 'class-transformer';
import { ReadBookDto } from './dto/read-book.dto';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { RoleType } from '../role/roleType.enum';
import { UpdateBookDto } from './dto';

@Injectable()
export class BookService {

    constructor(
        @InjectRepository(BookRepository)
        private readonly _bookRepository: BookRepository,
        
        @InjectRepository(UserRepository)
        private readonly _userRepository: UserRepository,
    ) {}

    async get( bookId: number ): Promise<ReadBookDto> {
        if( ! bookId ) throw new BadRequestException('Book ID must be sent');
        const book: Book = await this._bookRepository.findOne( bookId, {
            where: { status: 'ACTIVE' }
        });
        if ( ! book ) throw new NotFoundException('Book doesn\'t exist');
        return plainToClass( ReadBookDto, book );
    }

    async getAll(): Promise<ReadBookDto[]> {
        const books: Book[] = await this._bookRepository.find({
            where: { status: 'ACTIVE' }
        });
        return books.map( book => plainToClass( ReadBookDto, book ) );
    }

    async getBooksByAuthor( authorId: number ): Promise<ReadBookDto[]> {
        if( ! authorId ) throw new BadRequestException('Author ID must be sent');
        const books: Book[] = await this._bookRepository
            .createQueryBuilder('books')
            .leftJoin('books.authors', 'users')
            .where( 'books.status = :status', { status: 'ACTIVE' } )
            .andWhere( 'users.id = :id', { id: authorId } )
            .getMany();
        return books.map( book => plainToClass( ReadBookDto, book ) );
    }

    async create( book: Partial<CreateBookDto>): Promise<ReadBookDto> {
        const authors: User[] = [];

        for( const authorId of book.authors ) {

            // Check author existence
            const authorExists = await this._userRepository.findOne( authorId, {
                where: { status: 'ACTIVE' }
            });

            if( ! authorExists ) throw new NotFoundException( `There's not an author with this ID: ${ authorId }` );

            // Check user author role
            const isAuthor = authorExists.roles.some( (role: Role ) => role.name === RoleType.AUTHOR );

            if( ! isAuthor ) throw new UnauthorizedException( `This user ${ authorId } isn\'t an author` );

            authors.push( authorExists );
        }

        const savedBook: Book = await this._bookRepository.save({
            name: book.name,
            description: book.description,
            authors // Or a single result
        });

        return plainToClass( ReadBookDto, savedBook );
    }

    async createByAuthor( book: Partial<CreateBookDto>, authorId: number ) {
        const author = await this._userRepository.findOne( authorId, {
            where: { status: 'INACTIVE' }
        });

        const isAuthor = author.roles.some( (role: Role ) => role.name === RoleType.AUTHOR );

        if ( ! isAuthor ) throw new UnauthorizedException( `This user ${ authorId } isn\'t an author` );

        const savedBook: Book = await this._bookRepository.save({
            name: book.name,
            description: book.description,
            author // Or a single result
        });

        return plainToClass( ReadBookDto, savedBook );
    }

    async update( bookId: number, book: Partial<UpdateBookDto>, authorId: number ): Promise<ReadBookDto> {

        const bookExists = await this._bookRepository.findOne( bookId, {
            where: { status: 'ACTIVE' }
        });
        if ( ! bookExists ) throw new NotFoundException( 'This book doesn\'t exists' );

        const isOwnBook = bookExists.authors.some( author => author.id === authorId );
        if ( ! isOwnBook ) throw new UnauthorizedException( 'This user isn\'t the book\'s author' );
        
        const updatedBook = await this._bookRepository.update( bookId, book );
        return plainToClass( ReadBookDto, updatedBook );
    }

    async delete( bookId: number ): Promise<void> {
        const bookExists = await this._bookRepository.findOne( bookId, {
            where: { status: 'ACTIVE' }
        });
        if ( ! bookExists ) throw new NotFoundException( 'This book doesn\'t exists' );
        await this._bookRepository.update( bookId, { status: 'INACTIVE' } );
    }
}