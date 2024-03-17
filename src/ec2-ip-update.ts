import { DescribeInstancesCommand, EC2Client, type Tag } from "@aws-sdk/client-ec2";
import { ChangeResourceRecordSetsCommand, type RRType, Route53Client } from "@aws-sdk/client-route-53";
import type { EC2IntanceStateChangeEvent } from "aws-events";
import type { Handler } from "aws-lambda";

export const handler: Handler<EC2IntanceStateChangeEvent> = async event => {
	const ec2Client = new EC2Client({
		region: process.env.EC2_REGION || "us-east-1",
	});

	const instanceDetails = await ec2Client.send(
		new DescribeInstancesCommand({
			InstanceIds: [event.detail["instance-id"]],
		}),
	);

	const ec2Instance = instanceDetails.Reservations[0].Instances[0];
	// const { PublicIpAddress, Tags } = ec2Instance;
	const { Ipv6Address, PublicIpAddress, Tags } = ec2Instance;

	let Name: Tag | string = Tags.find(tag => tag.Key === "DNS_RECORD_NAME");
	if (!Name) {
		throw new Error("You have to specify a domain to update.");
	}
	Name = `${Name.Value}.`;

	let Type: Tag | RRType = Tags.find(tag => tag.Key === "DNS_RECORD_TYPE");
	Type = (Type ? Type.Value : "A") as RRType;
	let TTL: Tag | number = Tags.find(tag => tag.Key === "DNS_RECORD_TTL");
	TTL = TTL ? Number(TTL.Value) : 86400;

	let HostedZoneId: Tag | string = Tags.find(tag => tag.Key === "HOSTED_ZONE_ID");
	if (!HostedZoneId) {
		throw new Error("You have to specify a hosted zone.");
	}
	HostedZoneId = HostedZoneId.Value;

	const route53Client = new Route53Client();
	await route53Client.send(
		new ChangeResourceRecordSetsCommand({
			HostedZoneId,
			ChangeBatch: {
				Changes: [
					{
						Action: "UPSERT",
						ResourceRecordSet: {
							Name,
							Type,
							ResourceRecords: [{ Value: Type === "AAAA" ? Ipv6Address : PublicIpAddress }],
							TTL,
						},
					},
				],
			},
		}),
	);
};
