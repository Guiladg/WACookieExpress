import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import User from './user';

@Entity()
export default class RefreshToken extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { eager: true, onDelete: 'NO ACTION' })
	user: User;

	@Column()
	token: string;

	@Column()
	@CreateDateColumn()
	createdAt: Date;

	@Column({ type: 'bigint' })
	expires: number;
}
