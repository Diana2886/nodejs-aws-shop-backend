# nodejs-aws-shop-backend

[The link to CloudFront](https://d2za0p8r8k37bf.cloudfront.net/)

Links to Product Service API: [/products](https://ic4qlwt2a5.execute-api.eu-west-1.amazonaws.com/products)

[/products/{productId}](https://ic4qlwt2a5.execute-api.eu-west-1.amazonaws.com/products/1a2b3c4d-1234-5678-abcd-1234567890ab) - example

The link to the Import Service API: [/import](https://wo9elbcrc1.execute-api.eu-west-1.amazonaws.com/import?name=testfile.csv)

Product Service Swagger documentation openapi.yaml is in the product-service folder
Import Service Swagger documentation openapi.yaml is in the import-service folder

The SDK script for filling tables with test examples is in the src/db/dynamodb-data/fillTables.ts file
(I also tried to fill data using ./script.json file by running the following CLI command:
aws dynamodb batch-write-item --request-items file://script.json
Both methods are working)
