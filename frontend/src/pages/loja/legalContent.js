import { emailText, sellerLine, store } from "../../config/contact.js";

// Each mode has its own version: the texts describe how buying actually works.
export const UPDATED_AT = { catalog: "15 de novembro de 2026", commerce: "15 de novembro de 2026" };
export const seller = sellerLine();
const email = emailText();

// Texto de cada seção: uma string ou uma lista de parágrafos.
export function legalContent(commerce) {
  return {
    privacy: {
      label: "Privacidade",
      title: "Política de Privacidade",
      description: "Como a RustiCerrado cuida dos seus dados pessoais.",
      intro:
        "Explicamos de forma simples quais dados pessoais tratamos, para quê e como você pode exercer seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD).",
      sections: [
        [
          "Quem cuida dos seus dados",
          `A responsável pelos dados pessoais tratados pela ${store.brand} é ${seller}. Para qualquer assunto sobre privacidade, escreva para ${email}.`,
        ],
        [
          "Ao navegar no site",
          [
            commerce
              ? "Você pode ver as peças sem cadastro. Não usamos cookies de publicidade nem ferramentas de medição de visitas. O carrinho fica guardado no seu próprio navegador, e um cookie de sessão mantém você conectado(a) à sua conta."
              : "O site funciona como catálogo: você pode ver as peças sem cadastro. Não usamos cookies de publicidade nem ferramentas de medição de visitas.",
            "Para manter o site no ar e protegido, nossos fornecedores de hospedagem registram dados técnicos de acesso, como endereço IP, data, hora e páginas abertas. Esses registros servem apenas para segurança e funcionamento.",
          ],
        ],
        commerce
          ? [
              "Ao comprar pelo site",
              [
                "Para registrar o pedido, pedimos nome, e-mail, telefone e endereço de entrega. Usamos esses dados para processar o pagamento, produzir e entregar a peça, enviar os e-mails sobre o pedido e prestar atendimento depois da compra.",
                "Se você criar uma conta, guardamos também seus pedidos e endereços para facilitar as próximas compras. Sua senha é guardada de forma cifrada e nunca fica visível para a loja.",
                "Os dados do cartão são digitados diretamente no ambiente do Mercado Pago. A loja não recebe nem guarda o número do cartão.",
              ],
            ]
          : [
              "Ao fazer um pedido ou falar com a gente",
              [
                "Os pedidos são combinados pelo WhatsApp ou e-mail. Nessa conversa, tratamos os dados que você nos enviar, como nome, telefone, e-mail e endereço de entrega, para responder, produzir, entregar a peça e prestar atendimento depois da compra.",
                "Nas conversas por WhatsApp ou redes sociais, valem também as regras de privacidade dessas plataformas.",
              ],
            ],
        [
          "Com quem compartilhamos",
          commerce
            ? [
                "Somente com quem é necessário para atender você: o Mercado Pago (pagamento), os Correios ou a transportadora (entrega), e os serviços que fazem o site funcionar: Netlify (hospedagem do site), Neon (banco de dados) e Supabase (fotos das peças), além do serviço que envia os e-mails do pedido.",
                "Alguns desses serviços guardam dados fora do Brasil, com as garantias previstas na LGPD. Não vendemos nem alugamos dados pessoais.",
              ]
            : "Somente com quem é necessário para atender você: a empresa de pagamento escolhida (por exemplo, Mercado Pago), a transportadora ou os Correios para a entrega, e os serviços que hospedam o site e guardam as fotos das peças. Não vendemos nem alugamos dados pessoais.",
        ],
        [
          "Por quanto tempo guardamos",
          "Guardamos os dados enquanto forem necessários para o atendimento e pelo tempo exigido por lei, por exemplo para fins fiscais. Depois disso, eles são apagados ou anonimizados.",
        ],
        [
          "Seus direitos",
          commerce
            ? `Você pode pedir a confirmação de que tratamos seus dados, o acesso, a correção, a exclusão ou a portabilidade deles, e informações sobre o compartilhamento. Se tiver conta, faça o pedido em Minha conta; se preferir, escreva para ${email}. Respondemos nos prazos da LGPD.`
            : `Você pode pedir a confirmação de que tratamos seus dados, o acesso, a correção, a exclusão ou a portabilidade deles, e informações sobre o compartilhamento. Basta escrever para ${email}. Respondemos o quanto antes, nos prazos da LGPD.`,
        ],
        [
          "Mudanças nesta política",
          "Se a forma de tratar dados mudar, esta página será atualizada e a data no topo mudará.",
        ],
      ],
    },
    terms: {
      label: "Transparência",
      title: "Termos de Uso",
      description: "Condições de uso do site e de compra das peças RustiCerrado.",
      intro:
        "Estas são as regras para usar o site e comprar as peças da RustiCerrado. Ao usar o site ou fazer um pedido, você concorda com elas.",
      sections: [
        [
          "Quem vende",
          `As peças da ${store.brand} são vendidas por ${seller}. Contato: WhatsApp ou ${email}.`,
        ],
        commerce
          ? [
              "Como funciona a compra",
              [
                "Escolha a peça, coloque no carrinho e finalize informando seus dados e o endereço de entrega. Antes de pagar, você vê o resumo com o valor das peças, o frete e o total.",
                "Ao finalizar, a peça fica reservada para você por tempo limitado. Se o pagamento não for concluído nesse prazo, o pedido é cancelado automaticamente e a peça volta a ficar disponível.",
                "O pagamento é feito pelo Mercado Pago, com Pix ou cartão. O pedido só fica confirmado quando o Mercado Pago aprova o pagamento; você recebe um e-mail de confirmação e pode acompanhar tudo na página do pedido.",
                "Também é possível combinar uma compra pelo WhatsApp ou e-mail, principalmente para peças personalizadas.",
              ],
            ]
          : [
              "Como funciona a compra",
              [
                "O site é um catálogo. Para comprar, você chama a gente pelo WhatsApp ou e-mail. Na conversa, confirmamos a peça, a disponibilidade, o valor final, a forma de pagamento, o frete e o prazo.",
                "O pedido só fica confirmado depois que você recebe essa confirmação e o pagamento é aprovado.",
              ],
            ],
        [
          "Preços e disponibilidade",
          commerce
            ? "Os preços estão em reais (R$). Como as peças são feitas em pequenas quantidades, a disponibilidade pode mudar. O valor que vale é o mostrado no resumo do pedido antes do pagamento."
            : "Os preços estão em reais (R$). Como as peças são feitas em pequenas quantidades, a disponibilidade pode mudar. Se houver diferença entre o site e o atendimento, vale o que for confirmado antes do pagamento.",
        ],
        [
          "Peças artesanais",
          "Cada peça é feita à mão, em madeira natural e resina. Veios, nós, tons da madeira e desenhos da resina mudam de uma peça para outra; pequenas diferenças de cor, textura, formato e tamanho em relação às fotos são parte do processo artesanal e não são defeito.",
        ],
        [
          "Prazo de produção e entrega",
          commerce
            ? "O prazo estimado de entrega aparece antes do pagamento e na página do pedido. Quando a peça for enviada, você recebe por e-mail o código de rastreio. Peças personalizadas ou sob encomenda podem ter prazos maiores, combinados antes."
            : "O prazo de produção e o de entrega são informados no atendimento, antes do pagamento. Peças personalizadas ou sob encomenda podem ter prazos maiores, também combinados antes.",
        ],
        [
          "Trocas e devoluções",
          "As regras de desistência, troca e defeito estão na página Trocas e Devoluções.",
        ],
        [
          "Conteúdo do site",
          "Fotos, textos, marca e criações da RustiCerrado são protegidos. Não é permitido copiar ou usar esse conteúdo para fins comerciais sem autorização.",
        ],
        [
          "Uso adequado",
          "Não é permitido tentar invadir, sobrecarregar ou atrapalhar o funcionamento do site.",
        ],
        [
          "Atualizações",
          "Estes termos podem mudar. A data da versão fica no topo desta página; vale a versão em vigor no dia da sua compra.",
        ],
      ],
    },
    returns: {
      label: "Atendimento",
      title: "Trocas e Devoluções",
      description: "Como desistir, trocar ou resolver um defeito em uma peça RustiCerrado.",
      intro:
        "Queremos que você ame sua peça. Se algo não sair como esperado, veja abaixo como resolver.",
      sections: [
        [
          "Desistência em até 7 dias",
          [
            "Compras feitas fora de loja física (pelo WhatsApp, e-mail ou pelo site) podem ser canceladas em até 7 dias corridos depois de receber a peça, sem precisar explicar o motivo, conforme o artigo 49 do Código de Defesa do Consumidor.",
            `Para desistir, avise pelo WhatsApp ou pelo e-mail ${email} dentro desse prazo${commerce ? ", informando o número do pedido" : ""}. Vamos orientar como devolver a peça, que deve voltar sem sinais de uso e, se possível, na embalagem original.`,
            commerce
              ? "Devolvemos todos os valores pagos, incluindo o frete de envio. Compras pelo site são estornadas pelo Mercado Pago, na mesma forma de pagamento: no Pix, o valor volta para a conta de origem; no cartão, o estorno aparece na fatura conforme o prazo do banco emissor."
              : "Devolvemos todos os valores pagos, incluindo o frete de envio, pela mesma forma de pagamento ou outra que combinarmos com você.",
          ],
        ],
        [
          "Peça com defeito",
          [
            "Se a peça chegar com defeito ou apresentar um problema de fabricação, avise em até 90 dias, contados do recebimento ou, para defeitos que só aparecem com o tempo, de quando você perceber o problema.",
            "Envie fotos e uma breve descrição. Resolvemos em até 30 dias, com conserto ou troca da peça. Se não for possível, você pode escolher o dinheiro de volta ou um abatimento no preço.",
            "Diferenças naturais do trabalho artesanal (veja os Termos de Uso) e desgaste por uso, peça deixada de molho na água, lavada na lava-louças, exposta por muito tempo ao sol ou ao calor, ou quedas não são considerados defeito.",
          ],
        ],
        [
          "Troca por outro modelo",
          "Fora dos casos acima, a troca por outra peça pode ser combinada no atendimento, conforme a disponibilidade.",
        ],
        [
          "Peças personalizadas",
          "Peças feitas sob medida ou personalizadas têm as condições explicadas antes do pedido. Os direitos garantidos por lei continuam valendo.",
        ],
        [
          "Fale com a gente",
          `WhatsApp ou ${email}. Atendimento de ${seller}.`,
        ],
      ],
    },
  };
}
