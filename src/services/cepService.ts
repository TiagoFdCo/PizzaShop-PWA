/**
 * Busca de endereço por CEP via ViaCEP (https://viacep.com.br) — API pública
 * brasileira, gratuita, sem chave/autenticação. Usada no cadastro de cliente
 * pra preencher rua/bairro/cidade/UF automaticamente a partir do CEP, sem o
 * cliente digitar (só número e complemento ficam por conta dele).
 */

export class CepError extends Error {}

export interface CepAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function normalizeCep(value: string): string {
  return value.replace(/\D/g, "");
}

export async function fetchAddressByCep(rawCep: string): Promise<CepAddress> {
  const cep = normalizeCep(rawCep);
  if (cep.length !== 8) {
    throw new CepError("CEP deve ter 8 dígitos");
  }

  let res: Response;
  try {
    res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  } catch {
    throw new CepError("Não foi possível consultar o CEP. Verifique sua conexão.");
  }

  if (!res.ok) {
    throw new CepError(`Erro ${res.status} ao consultar o CEP.`);
  }

  const data = (await res.json()) as ViaCepResponse;
  if (data.erro) {
    throw new CepError("CEP não encontrado.");
  }

  return {
    cep,
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
}
