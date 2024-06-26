import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export const userRoles = ['admin'] as const;
export type UserRole = (typeof userRoles)[number];

@Entity('user')
@Unique(['phone'])
export default class User extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	phone: string;

	@Column({ nullable: true })
	password: string;

	@Column()
	role: UserRole;

	async hashPassword() {
		this.password = await User.hashAnyPassword(this.password);
	}

	async checkPassword(unencryptedPassword: string) {
		return await bcrypt.compare(unencryptedPassword, this.password);
	}

	static async hashAnyPassword(password?: string) {
		return await bcrypt.hash(password, 8);
	}
}
