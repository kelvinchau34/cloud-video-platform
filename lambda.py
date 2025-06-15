export const handler = async (event) => {
  console.log("S3 Event:", JSON.stringify(event, null, 2));

  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  try {
      console.log(bucket, key);

      return {
          statusCode: 200,
          body: JSON.stringify({
              "bucket" : bucket,
              "key" : key
          })
      };
  } catch (err) {
      console.log("Error getting object:", err);
      return {
          statusCode: 500,
          body: JSON.stringify({
              message: 'Error processing file',
              error: err.message
          })
      };
  }
};