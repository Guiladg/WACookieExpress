import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class AuthChangePasswordValidationSchema {
	@Length(4, 20)
	@IsNotEmpty()
	newPassword: string;
	@Length(4, 20)
	@IsNotEmpty()
	oldPassword: string;
}
export class AuthValidatePhoneValidationSchema {
	@Length(7, 15) // ITU-T E. 164
	@IsNumberString()
	phone: string;
}
export class AuthConfirmChangePhoneValidationSchema extends AuthValidatePhoneValidationSchema {
	@IsNotEmpty()
	token: string;
}
export class AuthRestorePasswordValidationSchema extends AuthValidatePhoneValidationSchema {
	@IsNotEmpty()
	token: string;
	@Length(4, 20)
	@IsNotEmpty()
	password: string;
}
