from botocore.client import ClientError
import boto3
import sys

bucket = sys.argv[1]
ACCESS_KEY = sys.argv[2]
SECRET_KEY = sys.argv[3]

s3 = boto3.resource('s3', aws_access_key_id=ACCESS_KEY, aws_secret_access_key=SECRET_KEY,)

try:
    s3.meta.client.head_bucket(Bucket=bucket)
except ClientError:
    # The bucket does not exist or you have no access.
    s3.create_bucket(Bucket=bucket)