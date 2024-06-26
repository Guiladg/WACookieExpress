import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

class UserBasicValidationSchema {
	@Length(7, 15) // ITU-T E. 164
	@IsNumberString()
	phone: string;
}
class UserBasicWithPasswordValidationSchema extends UserBasicValidationSchema {
	@Length(4, 20)
	@IsNotEmpty()
	password: string;
}

/** For using as validation schema on user login. */
export class UserLoginValidationSchema extends UserBasicWithPasswordValidationSchema {
	//
}

/** For using as validation schema on user creation. */
export class UserCreateValidationSchema extends UserBasicValidationSchema {
	//
}

/** For using as validation schema on user update. */
export class UserUpdateValidationSchema extends UserBasicValidationSchema {
	//
}
