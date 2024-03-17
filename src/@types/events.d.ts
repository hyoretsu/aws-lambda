declare module "aws-events" {
	import type { EventBridgeEvent } from "aws-lambda";

	export type EC2IntanceStateChangeEvent = EventBridgeEvent<
		"EC2 Instance State-change Notification",
		{
			"instance-id": string;
			state: string;
		}
	>;
}
