export default async function handler(req, res) {
    // Garante que só aceita pedidos do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const { cepDestino } = req.body;

    if (!cepDestino) {
        return res.status(400).json({ message: 'CEP de destino não fornecido' });
    }

    try {
        // Cole aqui o seu Token definitivo do Melhor Envio
        const MELHOR_ENVIO_TOKEN = 'COLE_AQUI_SEU_TOKEN_DO_MELHOR_ENVIO';
        const URL_BASE = 'https://api.melhorenvio.com.br'; 

        // O CEP de onde as suas encomendas saem (Coloquei o genérico de Sorocaba, altere para o seu exato)
        const CEP_ORIGEM = '18087179'; 

        const response = await fetch(`${URL_BASE}/api/v2/me/shipment/calculate`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                'User-Agent': 'MinhaBibliaStore (contato@suasecretaria.com)' // O Melhor Envio pede isto por segurança
            },
            body: JSON.stringify({
                from: {
                    postal_code: CEP_ORIGEM
                },
                to: {
                    postal_code: cepDestino.replace(/\D/g, '') // Limpa qualquer traço que o cliente digitar
                },
                products: [
                    {
                        id: "pulseiras",
                        width: 11,   // Largura da caixinha em cm
                        height: 4,   // Altura em cm
                        length: 16,  // Comprimento em cm
                        weight: 0.3, // 300 gramas
                        insurance_value: 50, // Valor declarado para seguro (ex: R$ 50)
                        quantity: 1
                    }
                ]
            })
        });

        const data = await response.json();

        // Se o Melhor Envio devolver algum erro (ex: CEP inválido)
        if (!Array.isArray(data)) {
            return res.status(400).json({ message: 'Erro ao calcular o frete. Verifique o CEP.', error: data });
        }

        // Filtra apenas as transportadoras que estão a funcionar e formata de forma limpa para o seu site
        const opcoesFrete = data
            .filter(opcao => !opcao.error)
            .map(opcao => ({
                id: opcao.id,
                nome: opcao.name,       // Ex: "PAC", "SEDEX", "Jadlog"
                preco: opcao.price,     // Valor já com desconto do Melhor Envio
                prazo: opcao.delivery_time // Tempo estimado de entrega em dias
            }));

        // Devolve as opções para o cliente escolher no ecrã da loja
        return res.status(200).json(opcoesFrete);

    } catch (error) {
        console.error('Erro na API de frete:', error);
        return res.status(500).json({ message: 'Erro interno ao calcular frete', error: error.message });
    }
}
