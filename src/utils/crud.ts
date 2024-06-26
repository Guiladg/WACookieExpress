import dataSource from '../dataSource';
import { BaseEntity, FindOptionsWhere } from 'typeorm';
import NotFoundError from '../errors/NotFoundError';
import DataBaseError from '../errors/DataBaseError';

/** Object with entity fields as keys */
export type ModelData<E extends BaseEntity> = {
	[P in keyof E]?: E[P] extends () => any ? never : E[P];
};

/** Entity field as literal */
export type Field<E extends BaseEntity> = keyof ModelData<E>;

/** Posible CRUD operations */
export type CrudOperation = 'create' | 'update' | 'delete';

export type UpdateCrudOptions<E extends BaseEntity> = {
	fields?: Field<E>[];
	data: ModelData<E>;
	idField?: Field<E>;
};
export type CreateCrudOptions<E extends BaseEntity> = Omit<UpdateCrudOptions<E>, 'idField'>;
export type DeleteCrudOptions<E extends BaseEntity> = Omit<UpdateCrudOptions<E>, 'fields'>;
export type CrudOptions<O extends CrudOperation, E extends BaseEntity> = O extends 'create'
	? CreateCrudOptions<E>
	: O extends 'delete'
		? DeleteCrudOptions<E>
		: UpdateCrudOptions<E>;

/** Executes a CRUD operations according to options.
 * @param options.operation The type of operation to execute
 * @param options.fields The fields of the new or updated entity to fill with the values in `data`. If not provided, every field in `data` and in the entity will be filled.
 * @param options.data Object containing the values to fill the new or updated entity.
 * @param options.idField The field that acts as primary column. If not provided, `id` will be used.
 */
export async function crudRecord<Operation extends CrudOperation, Entity extends BaseEntity>(
	operation: Operation,
	entity: new () => Entity,
	options: CrudOptions<Operation, Entity>
) {
	// Parameters (as UpdateCrudOptions for avoiding "property does not exist on type")
	const { data, fields, idField } = options as UpdateCrudOptions<Entity>;
	// If idField is not specified, use 'id'
	const _idField = (idField ?? 'id') as keyof Entity;

	// Temp record
	let record: Entity;

	if (operation === 'create') {
		// Create temp record
		record = new entity();
	} else {
		// Find record by id
		try {
			const where = { [_idField]: data[_idField] } as FindOptionsWhere<Entity>;
			record = await dataSource.manager.findOneByOrFail(entity, where);
		} catch (cause) {
			throw new NotFoundError({ message: cause.message, cause });
		}
	}

	if (operation !== 'delete') {
		// Fill record with data (can enumerate fields or leave it automatic)
		if (fields != undefined) {
			for (const field of fields) {
				record[field] = data[field];
			}
		} else {
			for (const field in data) {
				field in record && (record[field] = data[field]);
			}
		}
	}

	// try to Delete/Save record
	try {
		if (operation === 'delete') {
			await dataSource.manager.remove(record);
		} else {
			await dataSource.manager.save(record);
		}
	} catch (cause) {
		console.error(cause);
		throw new DataBaseError({ message: cause.message, cause });
	}

	return record;
}

/** Executes a create database operation according to options.
 * @param options.fields The fields of the new or updated entity to fill with the values in `data`. If not provided, every field in `data` and in the entity will be filled.
 * @param options.data Object containing the values to fill the new or updated entity.
 */
export async function createRecord<Entity extends BaseEntity>(entity: new () => Entity, options: CreateCrudOptions<Entity>) {
	return crudRecord('create', entity, options);
}

/** Executes an update database operation according to options.
 * @param options.fields The fields of the new or updated entity to fill with the values in `data`. If not provided, every field in `data` and in the entity will be filled.
 * @param options.data Object containing the values to fill the new or updated entity.
 * @param options.idField The field that acts as primary column. If not provided, `id` will be used.
 */
export async function updateRecord<Entity extends BaseEntity>(entity: new () => Entity, options: UpdateCrudOptions<Entity>) {
	return crudRecord('update', entity, options);
}

/** Executes a delete database operation according to options.
 * @param options.idField The field that acts as primary column. If not provided, `id` will be used.
 * @param options.data Object containing the values to fill the new or updated entity.
 */
export async function deleteRecord<Entity extends BaseEntity>(entity: new () => Entity, options: DeleteCrudOptions<Entity>) {
	return crudRecord('delete', entity, options);
}
