import { DeleteScheduleCommand, SchedulerClient } from "@aws-sdk/client-scheduler";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import type { Handler } from "aws-lambda";
import type { Pagamentos } from "fnde";

export const handler: Handler<any> = async (event, context) => {
	const today = new Date();

	const result: Pagamentos = await (
		await fetch("https://www.fnde.gov.br/digef/rs/spba/publica/pagamento/32333033323331")
	).json();

	const payments = Object.values(result.programas.find(({ nome }) => nome === "PET-ALUNO").entidades)[0]
		.funcoes["49"].pagamentos;

	let paymentMade = false;
	for (const { data: date } of payments) {
		const [day, month, year] = date.split("/");

		if (Number(year) === today.getFullYear() && Number(month) === today.getMonth() + 1) {
			paymentMade = true;
		}
	}

	if (paymentMade) {
		const schedulerClient = new SchedulerClient({ region: "us-east-2" });
		await schedulerClient.send(
			new DeleteScheduleCommand({
				Name: "pet-movel-hourly",
			}),
		);

		const snsClient = new SNSClient({ region: "us-east-2" });
		await snsClient.send(
			new PublishCommand({
				Message: "Já pode ir correndo pro caixa do BB mais próximo de você.",
				Subject: "[PET] As bolsas acabaram de cair!",
				TopicArn: "arn:aws:sns:us-east-2:182273057205:pet-bolsas",
			}),
		);
	}
};

// handler();
