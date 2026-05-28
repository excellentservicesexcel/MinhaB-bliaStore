export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const { order } = req.body;
    if (!order) {
        return res.status(400).json({ message: 'Dados do pedido ausentes' });
    }

    try {
        // Token definitivo que você gera no painel do Melhor Envio (Gerenciamento > Tokens)
        const MELHOR_ENVIO_TOKEN = 'SEU_TOKEN_DO_MELHOR_ENVIO_AQUI';
        const URL_BASE = 'https://api.melhorenvio.com.br'; // Use 'https://sandbox.melhorenvio.com.br' se estiver testando em modo simulado

        // 1. Adiciona o frete do cliente ao carrinho do Melhor Envio
        const cartResponse = await fetch(`${URL_BASE}/api/v2/me/cart`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                'User-Agent': 'MinhaBibliaStore (contato@excellentservices.com)'
            },
            body: JSON.stringify({
                service: 1, // 1 = Correios PAC, 2 = Correios SEDEX (Pode ser dinâmico baseado no frete pago)
                from: {
                    name: "Minha Bíblia Store",
                    phone: "15991422218",
                    email: "contato@excellentservices.com",
                    document: "00000000000", // Seu CPF ou CNPJ cadastrado no Melhor Envio
                    address: "Seu Endereço",
                    number: "123",
                    postal_code: "18000000", // Seu CEP de Sorocaba
                    city: "Sorocaba",
                    state: "SP"
                },
                to: {
                    name: order.userName,
                    phone: order.phone ? order.phone.replace(/\D/g, '') : "15999999999",
                    email: `${order.userId}@minhabiblia.com`,
                    address: order.endereco || "Endereço da Comanda", 
                    number: order.numero || "SN",
                    postal_code: order.cep || "18000000", // CEP de destino do cliente
                    city: order.cidade || "Sorocaba",
                    state: order.estado || "SP"
                },
                volumes: [
                    {
                        weight: 0.3, // Peso estimado de uma caixinha de pulseiras (300g)
                        width: 11,
                        height: 4,
                        length: 16
                    }
                ],
                options: {
                    insurance_value: 50,
                    receipt: false,
                    own_hand: false
                }
            })
        });

        const cartData = await cartResponse.json();
        if (!cartData.id) {
            return res.status(400).json({ message: 'Erro ao cadastrar frete no Melhor Envio', error: cartData });
        }

        const shipmentId = cartData.id;

        // 2. Efetua a compra da etiqueta usando o saldo disponível na sua carteira do Melhor Envio
        await fetch(`${URL_BASE}/api/v2/me/shipment/checkout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`
            },
            body: JSON.stringify({ orders: [shipmentId] })
        });

        // 3. Gera a ordem de impressão da etiqueta de envio
        await fetch(`${URL_BASE}/api/v2/me/shipment/print`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`
            },
            body: JSON.stringify({ orders: [shipmentId] })
        });

        // 4. Captura o link final gerado em PDF para download direto
        const printUrlResponse = await fetch(`${URL_BASE}/api/v2/me/shipment/print/url`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`
            },
            body: JSON.stringify({ orders: [shipmentId] })
        });

        const printData = await printUrlResponse.json();

        return res.status(200).json({ url: printData.url || null, shipmentId: shipmentId });

    } catch (error) {
        return res.status(500).json({ message: 'Erro interno no processamento do frete', error: error.message });
    }
}