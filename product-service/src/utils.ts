// import get from 'lodash/get';
// import isUndefined from 'lodash/isUndefined';

export const buildResponse = (statusCode: number, body: any) => ({
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Credentials': false,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
});

export const checkBodyParameters = (requiredParameters: any[], data: { [x: string]: any; }) => {
    return requiredParameters.every((parameter) => {
        // const parameterValue = get(data, parameter);
        const parameterValue = data[parameter];

        // if (isUndefined(parameterValue)) {
        if (parameterValue === undefined) {
            return false;
        }

        return true;
    });
};
