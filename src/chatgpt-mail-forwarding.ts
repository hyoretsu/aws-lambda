import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import type { Handler, SESEvent } from "aws-lambda";
import { simpleParser } from "mailparser";
import MailComposer from "nodemailer/lib/mail-composer";

const sourceEmail = "chatgpt@hyoretsu.com";
const emails = new Map([
	["Aran Leite", "hyoretsu@gmail.com"],
	["Breno Lima", "brenohslima@gmail.com"],
	["Breno Irmão", "lakerdantas96@gmail.com"],
	["Gabriel Lima", "gabrielllaraujo735@gmail.com"],
	["Gustavo Montenegro", "guga06436@gmail.com"],
	["Lucas Gomes Dantas", "danta83.cc@gmail.com"],
	["Rogério Martins", "rogeriofilho2@gmail.com"],
	["Victor Ortins", "ortinsv1@gmail.com"],
]);

export const handler: Handler<SESEvent> = async (event, context) => {
	const { messageId } = (event.Records[0].ses || JSON.parse(event.Records[0].Sns.Message)).mail;
	const Destinations = [...emails.values()];

	const s3Client = new S3Client({
		region: process.env.AWS_REGION || "us-east-1",
	});

	const emailObject = await s3Client.send(
		new GetObjectCommand({
			Bucket: "hyoretsu-emails",
			Key: `ChatGPT/${messageId}`,
		}),
	);

	const email = await simpleParser(await emailObject.Body.transformToString());

	const mailComposer = new MailComposer({
		from: `Rachadura do Gepeto <${sourceEmail}>`,
		subject: email.subject,
		html: email.textAsHtml,
		to: Destinations,
		text: email.text,
	}).compile();

	const sesClient = new SESClient({
		region: process.env.AWS_REGION || "us-east-1",
	});

	await sesClient.send(
		new SendRawEmailCommand({
			Destinations,
			Source: sourceEmail,
			RawMessage: {
				// @ts-expect-error
				Data: await mailComposer.build(),
			},
		}),
	);
};
