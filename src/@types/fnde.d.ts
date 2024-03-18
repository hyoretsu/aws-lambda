declare module "fnde" {
	export interface Entidade {
		cnpj: string;
		razaoSocial: string;
		funcoes: {
			[key: string]: Funcao;
		};
		subTotal: string;
		size: number;
	}

	export interface Funcao {
		nome: string;
		pagamentos: Pagamento[];
		subTotal: string;
		size: number;
	}

	export interface Pagamento {
		referencia: string;
		data: string;
		ordermBancaria: string;
		valor: string;
	}

	export interface Pagamentos {
		nome: string;
		cpf: string;
		municipio: string;
		uf: string;
		time: number;
		dataAtualizacao: string;
		programas: Programa[];
		total: string;
	}

	export interface Programa {
		nome: string;
		entidades: {
			[key: string]: Entidade;
		};
		subTotal: "2.100,00";
		size: 3;
	}
}
