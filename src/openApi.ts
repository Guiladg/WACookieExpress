import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'API Medex',
			version: '1.0.0',
			description: ''
		},
		servers: [
			{
				url: `${process.env.URL}${process.env.PORT ? ':' + process.env.PORT : ''}/${process.env.API_ROUTE}`
			}
		],
		components: {
			schemas: {
				ResponseList: {
					type: 'object',
					properties: {
						records: {
							type: 'array',
							items: {
								type: 'object'
							}
						},
						totalRecords: {
							type: 'integer',
							example: 100
						},
						page: {
							type: 'integer',
							example: 1
						},
						pageSize: {
							type: 'integer',
							example: 10
						},
						order: {
							type: 'string',
							example: 'id asc'
						}
					}
				},
				ResponseRecord: {
					type: 'object',
					properties: {
						record: {
							type: 'object'
						},
						message: {
							type: 'string',
							example: 'Operación realizada con éxito.'
						}
					}
				},
				UserNoId: {
					type: 'object',
					properties: {
						phone: {
							type: 'string',
							example: '541144445555'
						},
						role: {
							type: 'string',
							example: 'admin'
						}
					}
				},
				User: {
					allOf: [
						{
							type: 'object',
							properties: {
								id: {
									type: 'string',
									example: 'dwnxwizdeq'
								}
							}
						},
						{ $ref: '#/components/schemas/UserNoId' }
					]
				},
				ResponseListUser: {
					allOf: [
						{ $ref: '#/components/schemas/ResponseList' },
						{
							type: 'object',
							properties: { records: { items: { $ref: '#/components/schemas/User' } } }
						}
					]
				},
				ResponseRecordUser: {
					allOf: [
						{ $ref: '#/components/schemas/ResponseRecord' },
						{
							type: 'object',
							properties: { record: { $ref: '#/components/schemas/User' } }
						}
					]
				}
			},
			parameters: {
				QueryListPage: {
					name: 'page',
					in: 'query',
					schema: {
						type: 'integer'
					}
				},
				QueryListPageSize: {
					name: 'pageSize',
					in: 'query',
					schema: {
						type: 'integer'
					}
				},
				QueryListSort: {
					name: 'sort',
					in: 'query',
					schema: {
						type: 'string'
					}
				},
				QueryListOrder: {
					name: 'order',
					in: 'query',
					schema: {
						type: 'enum',
						enum: ['asc', 'desc']
					}
				}
			},
			securitySchemes: {
				cookieAuthControl: {
					type: 'apiKey',
					in: 'cookie',
					name: 'control_token'
				},
				cookieAuthAccess: {
					type: 'apiKey',
					in: 'cookie',
					name: 'access_token'
				},
				cookieAuthRefresh: {
					type: 'apiKey',
					in: 'cookie',
					name: 'refresh_token'
				}
			}
		}
	},
	apis: ['./src/routes/**/*.ts']
};

const specs = swaggerJsdoc(options);

export default specs;
