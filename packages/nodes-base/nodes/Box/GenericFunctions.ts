import {
	OptionsWithUri,
} from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IHookFunctions,
} from 'n8n-core';

import {
	IDataObject,
} from 'n8n-workflow';

export async function boxApiRequest(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IHookFunctions, method: string, resource: string, body: any = {}, qs: IDataObject = {}, uri?: string, option: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any

	let options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: uri || `https://api.box.com/2.0${resource}`,
		json: true,
	};
	options = Object.assign({}, options, option);

	try {
		if (Object.keys(body).length === 0) {
			delete options.body;
		}
		//@ts-ignore
		return await this.helpers.requestOAuth2.call(this, 'boxOAuth2Api', options);

	} catch (error) {

		let errorMessage;

		if (error.response && error.response.body) {

			if (error.response.body.context_info && error.response.body.context_info.errors) {

				const errors = error.response.body.context_info.errors;

				errorMessage = errors.map((e: IDataObject) => e.message);

				errorMessage = errorMessage.join('|');

			} else if (error.response.body.message) {

				errorMessage = error.response.body.message;

			}

			throw new Error(`Box error response [${error.statusCode}]: ${errorMessage}`);
		}
		throw error;
	}
}

export async function boxApiRequestAllItems(this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions, propertyName: string, method: string, endpoint: string, body: any = {}, query: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any

	const returnData: IDataObject[] = [];

	let responseData;
	query.limit = 100;

	do {
		responseData = await boxApiRequest.call(this, method, endpoint, body, query);
		query.marker = responseData['next_marker'];
		returnData.push.apply(returnData, responseData[propertyName]);
	} while (
		responseData['next_marker'] !== undefined &&
		responseData['next_marker'] !== ''
	);

	return returnData;
}
