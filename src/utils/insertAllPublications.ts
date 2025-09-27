import { supabase } from "@/integrations/supabase/client";
import { PublicationFormData } from "@/types";

const publicationsData: PublicationFormData[] = [
  // Bíblias
  { code: "nwtpkt", name: "Tradução do Novo Mundo (edição de bolso)", category: "Bíblias", current_stock: 2 },
  { code: "nwt", name: "Tradução do Novo Mundo (tamanho médio)", category: "Bíblias", current_stock: 5 },
  { code: "nwtls-T", name: "Tradução do Novo Mundo da Bíblia Sagrada (grande)", category: "Bíblias", current_stock: 0 },

  // Brochuras e Livretos
  { code: "ypq", name: "10 Perguntas", category: "Brochuras e Livretos", current_stock: 2 },
  { code: "lc", name: "A Vida — Teve um Criador?", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "lmd-t", name: "Ame as Pessoas", category: "Brochuras e Livretos", current_stock: 1 },
  { code: "gf", name: "Amigo de Deus", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "wfg", name: "Aprenda com a Sabedoria de Jesus", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "fg", name: "Boas Notícias", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "ph", name: "Caminho", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "ed", name: "Educação", category: "Brochuras e Livretos", current_stock: 7 },
  { code: "yc", name: "Ensine Seus Filhos", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "ld-t", name: "Escute a Deus", category: "Brochuras e Livretos", current_stock: 54 },
  { code: "ll-t", name: "Escute a Deus e Viva", category: "Brochuras e Livretos", current_stock: 125 },
  { code: "sp", name: "Espíritos dos Mortos", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "es26-T", name: "Examine as Escrituras", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "eslp26-T", name: "Examine as Escrituras (Grande)", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "hf", name: "Família", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "ay", name: "Leitura e Escrita", category: "Brochuras e Livretos", current_stock: 4 },
  { code: "th", name: "Melhore Sua Leitura", category: "Brochuras e Livretos", current_stock: 7 },
  { code: "bm", name: "Mensagem da Bíblia", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "mb", name: "Minhas Primeiras Lições da Bíblia", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "lf", name: "Origem da Vida", category: "Brochuras e Livretos", current_stock: 3 },
  { code: "wj", name: "Por Que Adorar a Deus", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "lffi-t", name: "Seja Feliz Para Sempre", category: "Brochuras e Livretos", current_stock: 430 },
  { code: "rk", name: "Verdadeira Fé", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "pc", name: "Verdadeira Paz e Felicidade", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "hl", name: "Vida Feliz", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "la", name: "Vida Satisfatória", category: "Brochuras e Livretos", current_stock: 0 },
  { code: "rj-t", name: "Volte para Jeová", category: "Brochuras e Livretos", current_stock: 14 },
  { code: "jl", name: "Vontade de Jeová", category: "Brochuras e Livretos", current_stock: 0 },

  // Formulários
  { code: "ic-t", name: "Cartão de Indenização", category: "Formulários", current_stock: 70 },
  { code: "dpa-t", name: "Cartão do Sangue", category: "Formulários", current_stock: 49 },
  { code: "bdg-E", name: "Porta-crachá (porta-cartão de lapela) - plástico", category: "Formulários", current_stock: 24 },
  { code: "S-24", name: "Recibo", category: "Formulários", current_stock: 0 },
  { code: "S-8", name: "Registro de Casa em Casa", category: "Formulários", current_stock: 0 },
  { code: "S-4", name: "Relatório de Serviço de Campo", category: "Formulários", current_stock: 1100 },

  // Kit de Ferramentas de Ensino
  { code: "jwcd4", name: "Cartão de visita do site (apenas o logo do jw.org)", category: "Kit de Ferramentas de Ensino", current_stock: 400 },
  { code: "jwcd10", name: "Cartão de visita do site (curso Bíblico pela internet)", category: "Kit de Ferramentas de Ensino", current_stock: 980 },
  { code: "jwcd9", name: "Cartão de visita do site (curso Bíblico presencial)", category: "Kit de Ferramentas de Ensino", current_stock: 0 },
  { code: "jwcd1", name: "Cartão de visita do site (imagem da Bíblia aberta)", category: "Kit de Ferramentas de Ensino", current_stock: 1200 },
  { code: "inv-t", name: "Convite para Reuniões Cristãs", category: "Kit de Ferramentas de Ensino", current_stock: 2417 },
  { code: "T-30", name: "O Que Você Acha da Bíblia?", category: "Kit de Ferramentas de Ensino", current_stock: 1570 },
  { code: "T-31", name: "O Que Você Espera do Futuro?", category: "Kit de Ferramentas de Ensino", current_stock: 475 },
  { code: "T-34", name: "O sofrimento vai acabar?", category: "Kit de Ferramentas de Ensino", current_stock: 1840 },
  { code: "T-33", name: "Quem controla o Mundo?", category: "Kit de Ferramentas de Ensino", current_stock: 4000 },
  { code: "T-36", name: "Reino", category: "Kit de Ferramentas de Ensino", current_stock: 0 },
  { code: "T-37", name: "Respostas Importantes", category: "Kit de Ferramentas de Ensino", current_stock: 670 },
  { code: "T-32", name: "Segredo para Família Feliz", category: "Kit de Ferramentas de Ensino", current_stock: 2640 },
  { code: "T-35", name: "Voltar a Viver", category: "Kit de Ferramentas de Ensino", current_stock: 2335 },

  // Livros
  { code: "cl", name: "Achegue-se", category: "Livros", current_stock: 0 },
  { code: "rr", name: "Adoração Pura", category: "Livros", current_stock: 0 },
  { code: "lfb", name: "Aprenda com as Histórias da Bíblia", category: "Livros", current_stock: 0 },
  { code: "be", name: "Beneficie-se", category: "Livros", current_stock: 0 },
  { code: "sjj", name: "Cante de Coração", category: "Livros", current_stock: 0 },
  { code: "sjjyls", name: "Cante de Coração — apenas letras", category: "Livros", current_stock: 0 },
  { code: "sjjls", name: "Cante de Coração (tamanho grande)", category: "Livros", current_stock: 0 },
  { code: "lvs", name: "Continue", category: "Livros", current_stock: 0 },
  { code: "vol25-T", name: "Encadernado", category: "Livros", current_stock: 0 },
  { code: "bhs", name: "Entenda a Bíblia", category: "Livros", current_stock: 0 },
  { code: "fy", name: "Família feliz", category: "Livros", current_stock: 0 },
  { code: "ia", name: "Imite", category: "Livros", current_stock: 0 },
  { code: "lr", name: "Instrutor", category: "Livros", current_stock: 0 },
  { code: "jr", name: "Jeremias", category: "Livros", current_stock: 0 },
  { code: "jy", name: "Jesus — o Caminho", category: "Livros", current_stock: 0 },
  { code: "yp1", name: "Jovens Perguntam, Volume 1", category: "Livros", current_stock: 0 },
  { code: "yp2", name: "Jovens Perguntam, Volume 2", category: "Livros", current_stock: 0 },
  { code: "cf", name: "Meu Seguidor", category: "Livros", current_stock: 0 },
  { code: "kr", name: "O Reino de Deus já governa!", category: "Livros", current_stock: 0 },
  { code: "od-t", name: "Organizados", category: "Livros", current_stock: 8 },
  { code: "ip-1", name: "Profecia de Isaías I", category: "Livros", current_stock: 0 },
  { code: "ip-2", name: "Profecia de Isaías II", category: "Livros", current_stock: 0 },
  { code: "lff-t", name: "Seja Feliz para Sempre! (livro)", category: "Livros", current_stock: 112 },
  { code: "bt", name: "Testemunho Cabal", category: "Livros", current_stock: 0 },

  // Revistas — Despertai!
  { code: "g24.1", name: "Despertai! Nº", category: "Revistas — Despertai!", current_stock: 114 },
  { code: "g23.1", name: "Despertai! Nº", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g18.1", name: "Despertai! Nº 1 2018", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g19.1", name: "Despertai! Nº 1 2019", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g20.1", name: "Despertai! Nº 1 2020", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g21.1", name: "Despertai! Nº 1 2021", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g22.1", name: "Despertai! Nº 1 2022", category: "Revistas — Despertai!", current_stock: 51 },
  { code: "g18.2", name: "Despertai! Nº 2 2018", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g19.2", name: "Despertai! Nº 2 2019", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g20.2", name: "Despertai! Nº 2 2020", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g21.2", name: "Despertai! Nº 2 2021", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g18.3", name: "Despertai! Nº 3 2018", category: "Revistas — Despertai!", current_stock: 45 },
  { code: "g19.3", name: "Despertai! Nº 3 2019", category: "Revistas — Despertai!", current_stock: 0 },
  { code: "g20.3", name: "Despertai! Nº 3 2020", category: "Revistas — Despertai!", current_stock: 203 },
  { code: "g21.3", name: "Despertai! Nº 3 2021", category: "Revistas — Despertai!", current_stock: 90 },

  // Revistas — Sentinela
  { code: "wp24.1", name: "Sentinela Nº", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp18.1", name: "Sentinela Nº 1 2018", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp19.1", name: "Sentinela Nº 1 2019", category: "Revistas — Sentinela", current_stock: 41 },
  { code: "wp20.1", name: "Sentinela Nº 1 2020", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp21.1", name: "Sentinela Nº 1 2021", category: "Revistas — Sentinela", current_stock: 52 },
  { code: "wp22.1", name: "Sentinela Nº 1 2022", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp18.2", name: "Sentinela Nº 2 2018", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp19.2", name: "Sentinela Nº 2 2019", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp20.2", name: "Sentinela Nº 2 2020", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp21.2", name: "Sentinela Nº 2 2021", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp18.3", name: "Sentinela Nº 3 2018", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp19.3", name: "Sentinela Nº 3 2019", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp20.3", name: "Sentinela Nº 3 2020", category: "Revistas — Sentinela", current_stock: 0 },
  { code: "wp21.3", name: "Sentinela Nº 3 2021", category: "Revistas — Sentinela", current_stock: 0 },
];

export const insertAllPublications = async () => {
  try {
    console.log(`Inserindo ${publicationsData.length} publicações...`);
    
    const { data, error } = await supabase
      .from('publications')
      .insert(publicationsData)
      .select();

    if (error) {
      console.error('Erro ao inserir publicações:', error);
      throw error;
    }

    console.log(`✅ ${publicationsData.length} publicações inseridas com sucesso!`);
    return { success: true, data, count: publicationsData.length };
  } catch (error) {
    console.error('❌ Erro ao inserir publicações:', error);
    return { success: false, error };
  }
};

// Executar automaticamente
insertAllPublications();