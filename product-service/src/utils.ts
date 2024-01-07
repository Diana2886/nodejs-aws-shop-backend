export const buildResponse = (statusCode: number, body: any) => ({
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        "Access-Control-Allow-Methods": "*",
    },
    body: JSON.stringify(body),
});
