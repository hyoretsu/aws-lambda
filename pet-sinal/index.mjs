import { ComparisonOperator, DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { capitalize } from "@hyoretsu/utils";
import { format, isSameMonth, parse, setDefaultOptions } from "date-fns";
import { ptBR as locale } from "date-fns/locale";
import { JSDOM } from "jsdom";

setDefaultOptions({ locale });

/** @type {import("aws-lambda").Handler<import("aws-lambda").EventBridgeEvent>} */
export async function handler(event, context) {
	const today = new Date();

	const dynamoDbClient = new DynamoDBClient({ region: "us-east-2" });
	const entryKey = `pet-${today.getMonth()}-${today.getFullYear()}`;

	const alreadySent = await dynamoDbClient.send(new QueryCommand({
		KeyConditions: {
			fe263071497d7b59a3ddd846303b183dd4e282af0f2a57c80201d43e3402ea04: {
				ComparisonOperator: ComparisonOperator.EQ,
				AttributeValueList: [{ S: entryKey }]
			}
		},
		// FilterExpression: `fe263071497d7b59a3ddd846303b183dd4e282af0f2a57c80201d43e3402ea04 = "pet-${today.getMonth()}-${today.getFullYear()}"`,
		TableName: "BolsasEstudantis",
	}));

	if (alreadySent.Count === 1) {
		return;
	}

	const fndePage = await fetch(
		"https://www.fnde.gov.br/sigefweb/index.php/liberacoes/resultado-entidade/ano/2024/programa/PS/cnpj/00000000000191"
	);

	const pageContent = new JSDOM(await fndePage.text()).window.document;
	const transactionElements = [...pageContent.querySelector("#programa0 tbody").children];

	const transactions = [];
	for (const transaction of transactionElements) {
		const [date, order, value] = [...transaction.children].map(field => field.innerHTML);
		const parsedDate = parse(date, "dd/MMM/yy", new Date())

		if (!isSameMonth(parsedDate, today)) {
			continue;
		}

		transactions.push({
			date: parsedDate,
			order: Number(order),
			value: Number(value.replaceAll(".", "").replace(",", ".")),
		})
	};
	transactions.sort(
		(transactionA, transactionB) => transactionA.order > transactionB.order ? 1 : -1
	)

	const creditTransaction = transactions.find(transaction => transaction.value > 1000000);

	if (creditTransaction) {
		dynamoDbClient.send(new PutItemCommand({
			Item: {
				fe263071497d7b59a3ddd846303b183dd4e282af0f2a57c80201d43e3402ea04: {
					S: entryKey,
				},
			},
			TableName: "BolsasEstudantis",
		}));

		today.setMonth(today.getMonth() - 1);

		const snsClient = new SNSClient({ region: "us-east-2" });
		await snsClient.send(new PublishCommand({
			Message: "Elas devem cair em 5 dias úteis, contando a partir de hoje.",
			Subject: `[PET] Bolsas de ${capitalize(format(today, 'MMM'))}/${format(today, "yy")} enviadas`,
			TopicArn: "arn:aws:sns:us-east-2:182273057205:pet-bolsas",
		}));
	}
}

// handler();
