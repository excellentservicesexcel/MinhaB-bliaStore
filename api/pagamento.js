import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    try {
        // Coloque aqui o seu Access Token verdadeiro
        const client = new MercadoPagoConfig({ accessToken: 'APP_USR-5743233797055922-052313-a47c41a8fbb23136a1e8d60b70cc7df9-1370551812' });
        const payment = new Payment(client);

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

        const response = await payment.create({ body });
        
        // NOVO: Captura os dados do PIX (QR Code) se o cliente escolher pagar no PIX
        let pixData = null;
        if (response.point_of_interaction && response.point_of_interaction.transaction_data) {
            pixData = {
                qr_code: response.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64
            };
        }

        // Devolve os dados para a sua tela inicial
        return res.status(200).json({ 
            status: response.status, 
            id: response.id,
            pix: pixData // O QR Code e o código "Copia e Cola" vão embutidos aqui
        });

    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        return res.status(500).json({ message: 'Erro interno no servidor', error: error.message });
    }
}
