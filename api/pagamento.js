import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
    // Vercel Serverless Function: Bloqueia qualquer coisa que não seja POST (envio de dados do carrinho)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    try {
        // O seu Access Token Oculto e Seguro (Nunca exposto no HTML do cliente)
        const client = new MercadoPagoConfig({ accessToken: 'APP_USR-5743233797055922-052313-a47c41a8fbb23136a1e8d60b70cc7df9-1370551812' });
        const payment = new Payment(client);

        // O formData é o que o Brick (front-end) gera contendo os dados embaralhados do cartão
        const body = {
            transaction_amount: req.body.formData.transaction_amount,
            token: req.body.formData.token,
            description: req.body.formData.description || 'Compra - Minha Bíblia Store',
            installments: req.body.formData.installments,
            payment_method_id: req.body.formData.payment_method_id,
            issuer_id: req.body.formData.issuer_id,
            payer: {
                email: req.body.formData.payer.email,
                identification: req.body.formData.payer.identification
            }
        };

        // Bate na porta do Mercado Pago e manda processar a compra
        const response = await payment.create({ body });
        
        // Retorna a resposta imediata para a tela do seu cliente (Aprovado, Recusado, Processando)
        return res.status(200).json({ status: response.status, id: response.id });

    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        return res.status(500).json({ message: 'Erro interno no servidor', error: error.message });
    }
}
