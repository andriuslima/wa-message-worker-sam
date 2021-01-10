from botocore.client import ClientError
import boto3
import sys

bucket = sys.argv[1].strip()
ACCESS_KEY = sys.argv[2].strip()
SECRET_KEY = sys.argv[3].strip()
REGION = sys.argv[4].strip()

s3 = boto3.resource('s3',
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name=REGION)

try:
    s3.meta.client.head_bucket(Bucket=bucket)
except ClientError:
    # This exception means that the bucket could not be found. So we must create it
    s3.create_bucket(
        Bucket=bucket,
        CreateBucketConfiguration={'LocationConstraint': REGION})