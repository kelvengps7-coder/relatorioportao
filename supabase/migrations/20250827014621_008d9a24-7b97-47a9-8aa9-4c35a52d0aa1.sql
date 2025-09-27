-- Limpar todas as publicações existentes
DELETE FROM public.movements;
DELETE FROM public.publications;

-- Recadastrar todas as publicações conforme a nova organização
INSERT INTO public.publications (code, name, category, current_stock, total_entries, total_exits) VALUES

-- Bíblias (ordenação alfabética)
('bíblias', 'Outras Bíblias', 'Bíblias', 0, 0, 0),
('nwt', 'Tradução do Novo Mundo (tamanho médio)', 'Bíblias', 0, 0, 0),
('nwtpkt', 'Tradução do Novo Mundo (edição de bolso)', 'Bíblias', 0, 0, 0),

-- Brochuras e Livretos (ordenação alfabética)
('ay', 'Leitura e Escrita', 'Brochuras e Livretos', 0, 0, 0),
('bm', 'Mensagem da Bíblia', 'Brochuras e Livretos', 0, 0, 0),
('ed', 'Educação', 'Brochuras e Livretos', 0, 0, 0),
('fg', 'Boas Notícias', 'Brochuras e Livretos', 0, 0, 0),
('gf', 'Amigo de Deus', 'Brochuras e Livretos', 0, 0, 0),
('hf', 'Família', 'Brochuras e Livretos', 0, 0, 0),
('hl', 'Vida Feliz', 'Brochuras e Livretos', 0, 0, 0),
('jl', 'Vontade de Jeová', 'Brochuras e Livretos', 0, 0, 0),
('la', 'Vida Satisfatória', 'Brochuras e Livretos', 0, 0, 0),
('lc', 'A Vida — Teve um Criador?', 'Brochuras e Livretos', 0, 0, 0),
('ld', 'Escute a Deus', 'Brochuras e Livretos', 0, 0, 0),
('lf', 'Origem da Vida', 'Brochuras e Livretos', 0, 0, 0),
('mb', 'Minhas Primeiras Lições da Bíblia', 'Brochuras e Livretos', 0, 0, 0),
('ol', 'Caminho para a Vida', 'Brochuras e Livretos', 0, 0, 0),
('pc', 'Verdadeira Paz e Felicidade', 'Brochuras e Livretos', 0, 0, 0),
('ph', 'Caminho', 'Brochuras e Livretos', 0, 0, 0),
('rj', 'Volte para Jeová', 'Brochuras e Livretos', 0, 0, 0),
('rk', 'Verdadeira Fé', 'Brochuras e Livretos', 0, 0, 0),
('sp', 'Espíritos dos Mortos', 'Brochuras e Livretos', 0, 0, 0),
('th', 'Melhore', 'Brochuras e Livretos', 0, 0, 0),
('wfg', 'Aprenda com a Sabedoria de Jesus', 'Brochuras e Livretos', 0, 0, 0),
('wj', 'Por Que Adorar a Deus', 'Brochuras e Livretos', 0, 0, 0),
('yc', 'Ensine Seus Filhos', 'Brochuras e Livretos', 0, 0, 0),
('ypq', '10 Perguntas', 'Brochuras e Livretos', 0, 0, 0),
('amor2024', 'Ame as Pessoas (Nova 2024)', 'Brochuras e Livretos', 0, 0, 0),
('outras-brochuras', 'Outras brochuras e livretos', 'Brochuras e Livretos', 0, 0, 0),

-- Formulários (ordenação alfabética)
('S-24', 'Recibo', 'Formulários', 0, 0, 0),
('S-4', 'Relatório de Serviço de Campo', 'Formulários', 0, 0, 0),
('S-8', 'Registro de Casa em Casa', 'Formulários', 0, 0, 0),

-- Kit de Ferramentas de Ensino (ordenação alfabética)
('jwcd1', 'Cartão de visita do site (imagem da Bíblia aberta)', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('jwcd4', 'Cartão de visita do site (apenas o logo do jw.org)', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('jwcd9', 'Cartão de visita do site (curso Bíblico presencial)', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('jwcd10', 'Cartão de visita do site (curso Bíblico pela internet)', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('inv', 'Convite para Reuniões Cristãs', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('lff', 'Seja Feliz para Sempre! (livro)', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('lffi', 'Seja Feliz para Sempre! (brochura)', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('ll', 'Escute e Viva', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-30', 'O Que Você Acha da Bíblia?', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-31', 'O Que Você Espera do Futuro?', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-32', 'Segredo para Família Feliz', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-33', 'Quem controla o Mundo?', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-34', 'O sofrimento vai acabar?', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-35', 'Voltar a Viver', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-36', 'Reino', 'Kit de Ferramentas de Ensino', 0, 0, 0),
('T-37', 'Respostas Importantes', 'Kit de Ferramentas de Ensino', 0, 0, 0),

-- Livros (ordenação alfabética)
('be', 'Beneficie-se', 'Livros', 0, 0, 0),
('bhs', 'Entenda a Bíblia', 'Livros', 0, 0, 0),
('bt', 'Testemunho Cabal', 'Livros', 0, 0, 0),
('cf', 'Meu Seguidor', 'Livros', 0, 0, 0),
('cl', 'Achegue-se', 'Livros', 0, 0, 0),
('fy', 'Família feliz', 'Livros', 0, 0, 0),
('ia', 'Imite', 'Livros', 0, 0, 0),
('ip-1', 'Profecia de Isaías I', 'Livros', 0, 0, 0),
('ip-2', 'Profecia de Isaías II', 'Livros', 0, 0, 0),
('jr', 'Jeremias', 'Livros', 0, 0, 0),
('jy', 'Jesus — o Caminho', 'Livros', 0, 0, 0),
('kr', 'O Reino de Deus já governa!', 'Livros', 0, 0, 0),
('lfb', 'Aprenda com as Histórias da Bíblia', 'Livros', 0, 0, 0),
('livros', 'Outros livros', 'Livros', 0, 0, 0),
('lr', 'Instrutor', 'Livros', 0, 0, 0),
('lvs', 'Continue', 'Livros', 0, 0, 0),
('od', 'Organizados', 'Livros', 0, 0, 0),
('rr', 'Adoração Pura', 'Livros', 0, 0, 0),
('sjj', 'Cante de Coração', 'Livros', 0, 0, 0),
('sjjls', 'Cante de Coração (tamanho grande)', 'Livros', 0, 0, 0),
('sjjyls', 'Cante de Coração — apenas letras', 'Livros', 0, 0, 0),
('yp1', 'Jovens Perguntam, Volume 1', 'Livros', 0, 0, 0),
('yp2', 'Jovens Perguntam, Volume 2', 'Livros', 0, 0, 0),

-- Revistas — Despertai! (ordenação numérica)
('g18.1', 'Despertai! Nº 1 2018', 'Revistas — Despertai!', 0, 0, 0),
('g18.2', 'Despertai! Nº 2 2018', 'Revistas — Despertai!', 0, 0, 0),
('g18.3', 'Despertai! Nº 3 2018', 'Revistas — Despertai!', 0, 0, 0),
('g19.1', 'Despertai! Nº 1 2019', 'Revistas — Despertai!', 0, 0, 0),
('g19.2', 'Despertai! Nº 2 2019', 'Revistas — Despertai!', 0, 0, 0),
('g19.3', 'Despertai! Nº 3 2019', 'Revistas — Despertai!', 0, 0, 0),
('g20.1', 'Despertai! Nº 1 2020', 'Revistas — Despertai!', 0, 0, 0),
('g20.2', 'Despertai! Nº 2 2020', 'Revistas — Despertai!', 0, 0, 0),
('g20.3', 'Despertai! Nº 3 2020', 'Revistas — Despertai!', 0, 0, 0),
('g21.1', 'Despertai! Nº 1 2021', 'Revistas — Despertai!', 0, 0, 0),
('g21.2', 'Despertai! Nº 2 2021', 'Revistas — Despertai!', 0, 0, 0),
('g21.3', 'Despertai! Nº 3 2021', 'Revistas — Despertai!', 0, 0, 0),
('g22.1', 'Despertai! Nº 1 2022', 'Revistas — Despertai!', 0, 0, 0),
('g23.1', 'Despertai! Nº', 'Revistas — Despertai!', 0, 0, 0),
('g24.1', 'Despertai! Nº', 'Revistas — Despertai!', 0, 0, 0),

-- Revistas — Sentinela (ordenação numérica)
('wp18.1', 'Sentinela Nº 1 2018', 'Revistas — Sentinela', 0, 0, 0),
('wp18.2', 'Sentinela Nº 2 2018', 'Revistas — Sentinela', 0, 0, 0),
('wp18.3', 'Sentinela Nº 3 2018', 'Revistas — Sentinela', 0, 0, 0),
('wp19.1', 'Sentinela Nº 1 2019', 'Revistas — Sentinela', 0, 0, 0),
('wp19.2', 'Sentinela Nº 2 2019', 'Revistas — Sentinela', 0, 0, 0),
('wp19.3', 'Sentinela Nº 3 2019', 'Revistas — Sentinela', 0, 0, 0),
('wp20.1', 'Sentinela Nº 1 2020', 'Revistas — Sentinela', 0, 0, 0),
('wp20.2', 'Sentinela Nº 2 2020', 'Revistas — Sentinela', 0, 0, 0),
('wp20.3', 'Sentinela Nº 3 2020', 'Revistas — Sentinela', 0, 0, 0),
('wp21.1', 'Sentinela Nº 1 2021', 'Revistas — Sentinela', 0, 0, 0),
('wp21.2', 'Sentinela Nº 2 2021', 'Revistas — Sentinela', 0, 0, 0),
('wp21.3', 'Sentinela Nº 3 2021', 'Revistas — Sentinela', 0, 0, 0),
('wp21.6', 'Sentinela Nº', 'Revistas — Sentinela', 0, 0, 0),
('wp22.1', 'Sentinela Nº 1 2022', 'Revistas — Sentinela', 0, 0, 0),
('wp24.1', 'Sentinela Nº', 'Revistas — Sentinela', 0, 0, 0),
('outras-revistas', 'Todas as outras Revistas – edição para o público', 'Revistas — Sentinela', 0, 0, 0);

-- Criar a tabela de pedidos se não existir
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  irmao TEXT NOT NULL,
  publicacao_id UUID NOT NULL,
  quantidade INTEGER NOT NULL,
  data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
  enviado BOOLEAN NOT NULL DEFAULT false,
  entregue BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (publicacao_id) REFERENCES public.publications(id) ON DELETE CASCADE
);

-- Enable RLS on pedidos table
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create policies for pedidos
CREATE POLICY "Pedidos are viewable by everyone" 
ON public.pedidos 
FOR SELECT 
USING (true);

CREATE POLICY "Pedidos can be inserted by everyone" 
ON public.pedidos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Pedidos can be updated by everyone" 
ON public.pedidos 
FOR UPDATE 
USING (true);

CREATE POLICY "Pedidos can be deleted by everyone" 
ON public.pedidos 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();