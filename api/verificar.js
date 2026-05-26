import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    // Pega o ID da transação que o front-end está perguntando
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'ID do pagamento não fornecido' });
    }

    try {
        // Coloque o seu Access Token verdadeiro aqui
        const client = new MercadoPagoConfig({ accessToken: 'APP_USR-5743233797055922-052313-a47c41a8fbb23136a1e8d60b70cc7df9-1370551812' });
        const payment = new Payment(client);

        // Bate no Mercado Pago para ver o status atual
        const response = await payment.get({ id });

        // Devolve o status (ex: 'pending', 'approved', etc)
        return res.status(200).json({ status: response.status });
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        return res.status(500).json({ message: 'Erro ao verificar pagamento', error: error.message });
    }
}
