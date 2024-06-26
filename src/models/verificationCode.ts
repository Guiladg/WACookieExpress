import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import User from './user';

@Entity()
export default class VerificationCode extends BaseEntity {
	@PrimaryGeneratedColumn()
	idVerificationCode: number;

	@Column()
	phone: string;

	@Column()
	token: string;

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column({ type: 'bigint' })
	expires: number;
}
