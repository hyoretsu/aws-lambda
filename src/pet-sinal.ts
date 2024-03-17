import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { CreateScheduleCommand, SchedulerClient } from "@aws-sdk/client-scheduler";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { capitalize } from "@hyoretsu/utils";
import type { Handler, ScheduledEvent } from "aws-lambda";
import {
	addBusinessDays,
	addDays,
	addMonths,
	differenceInDays,
	format,
	isSameMonth,
	parse,
	setDefaultOptions,
} from "date-fns";
import { ptBR as locale } from "date-fns/locale";
import { JSDOM } from "jsdom";

setDefaultOptions({ locale });

interface Transaction {
	date: Date;
	order: number;
	value: number;
}

export const handler: Handler<ScheduledEvent> = async (event, context) => {
	const today = new Date();

	const dynamoDbClient = new DynamoDBClient({ region: "us-east-2" });
	const entryKey = `pet-${today.getMonth()}-${today.getFullYear()}`;

	const alreadySent = await dynamoDbClient.send(
		new QueryCommand({
			KeyConditions: {
				fe263071497d7b59a3ddd846303b183dd4e282af0f2a57c80201d43e3402ea04: {
					ComparisonOperator: "EQ",
					AttributeValueList: [{ S: entryKey }],
				},
			},
			TableName: "BolsasEstudantis",
		}),
	);

	if (alreadySent.Count === 1) {
		return;
	}

	const fndePage = await fetch(
		`https://www.fnde.gov.br/sigefweb/index.php/liberacoes/resultado-entidade/ano/${today.getFullYear()}/programa/PS/cnpj/00000000000191`,
	);

	const pageContent = new JSDOM(await fndePage.text()).window.document;
	const transactionElements = [...pageContent.querySelector("#programa0 tbody")!.children];

	const transactions: Transaction[] = [];
	for (const transaction of transactionElements) {
		const [date, order, value] = [...transaction.children].map(field => field.innerHTML as string);
		const parsedDate = parse(date, "dd/MMM/yy", new Date());

		if (!isSameMonth(parsedDate, today)) {
			continue;
		}

		transactions.push({
			date: parsedDate,
			order: Number(order),
			value: Number(value.replaceAll(".", "").replace(",", ".")),
		});
	}
	transactions.sort((transactionA, transactionB) => (transactionA.order > transactionB.order ? 1 : -1));

	const creditTransaction = transactions.find(transaction => transaction.value > 1000000);

	if (creditTransaction) {
		await dynamoDbClient.send(
			new PutItemCommand({
				Item: {
					fe263071497d7b59a3ddd846303b183dd4e282af0f2a57c80201d43e3402ea04: {
						S: entryKey,
					},
				},
				TableName: "BolsasEstudantis",
			}),
		);

		const { date } = creditTransaction;

		const schedulerClient = new SchedulerClient({ region: "us-east-2" });
		const StartDate = addBusinessDays(date, 4);
		const EndDate = addDays(StartDate, 1);
		await schedulerClient.send(
			new CreateScheduleCommand({
				Name: "pet-movel-hourly",
				Description: "Runs 'pet-movel' Lambda function every hour 4 business days from now.",
				ActionAfterCompletion: "DELETE",
				ScheduleExpression: "rate(1 hours)",
				StartDate,
				EndDate,
				FlexibleTimeWindow: {
					Mode: "OFF",
				},
				Target: {
					Arn: "arn:aws:lambda:us-east-2:182273057205:function:pet-movel",
					RoleArn: "arn:aws:iam::182273057205:role/Amazon_EventBridge",
				},
			}),
		);

		const snsClient = new SNSClient({ region: "us-east-2" });
		await snsClient.send(
			new PublishCommand({
				Message: `Elas devem cair em ${
					5 - differenceInDays(today, date)
				} dias úteis, contando a partir de hoje.`,
				Subject: `[PET] Bolsas de ${capitalize(format(addMonths(date, -1), "MMM"))}/${format(
					date,
					"yy",
				)} enviadas!`,
				TopicArn: "arn:aws:sns:us-east-2:182273057205:pet-bolsas",
			}),
		);
	}
};

// handler();
