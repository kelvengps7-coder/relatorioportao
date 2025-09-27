-- Criar tabela para publicações
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para movimentações
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso público (sem autenticação necessária)
CREATE POLICY "Permitir acesso total às publicações" 
ON public.publications 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir acesso total às movimentações" 
ON public.movements 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais das publicações
INSERT INTO public.publications (code, name, current_stock, total_entries, total_exits, category) VALUES
-- Convites e Cartões
('Convites 7305', 'Convite para Reuniões Cristãs 7305', 1000, 1000, 0, 'Convites e Cartões'),
('jwcd1', 'Cartão de visita do site (imagem da Bíblia aberta)', 0, 0, 0, 'Convites e Cartões'),
('jwcd4', 'Cartão de visita do site (apenas o logo do jw.org)', 0, 0, 0, 'Convites e Cartões'),
('jwcd9', 'Cartão de visita do site (curso Bíblico presencial)', 0, 0, 0, 'Convites e Cartões'),
('jwcd10', 'Cartão de visita do site (curso Bíblico pela internet)', 0, 0, 0, 'Convites e Cartões'),

-- Livros Básicos
('lff', 'Seja Feliz para Sempre! (livro)', 0, 0, 0, 'Livros Básicos'),
('lffi', 'Seja Feliz para Sempre! (brochura)', 0, 0, 0, 'Livros Básicos'),
('ll', 'Escute e Viva', 0, 0, 0, 'Livros Básicos'),
('T-30', 'O Que Você Acha da Bíblia?', 0, 0, 0, 'Livros Básicos'),
('T-31', 'O Que Você Espera do Futuro?', 0, 0, 0, 'Livros Básicos'),
('T-32', 'Segredo para Família Feliz', 0, 0, 0, 'Livros Básicos'),
('T-33', 'Quem controla o Mundo?', 1000, 1000, 0, 'Livros Básicos'),
('T-34', 'O sofrimento vai acabar?', 0, 0, 0, 'Livros Básicos'),
('T-35', 'Voltar a Viver', 0, 0, 0, 'Livros Básicos'),
('T-36', 'Reino', 0, 0, 0, 'Livros Básicos'),
('T-37', 'Respostas Importantes', 0, 0, 0, 'Livros Básicos'),

-- Livros de Estudo
('be', 'Beneficie-se', 1000, 1000, 0, 'Livros de Estudo'),
('bhs', 'Entenda a Bíblia', 0, 0, 0, 'Livros de Estudo'),
('bt', 'Testemunho Cabal', 0, 0, 0, 'Livros de Estudo'),
('cf', '''Meu Seguidor''', 0, 0, 0, 'Livros de Estudo'),
('cl', 'Achegue-se', 0, 0, 0, 'Livros de Estudo'),
('fy', 'Família feliz', 0, 0, 0, 'Livros de Estudo'),
('ia', 'Imite', 0, 0, 0, 'Livros de Estudo'),
('ip-1', 'Profecia de Isaías I', 0, 0, 0, 'Livros de Estudo'),
('ip-2', 'Profecia de Isaías II', 0, 0, 0, 'Livros de Estudo'),
('jr', 'Jeremias', 0, 0, 0, 'Livros de Estudo'),
('jy', 'Jesus — o Caminho', 0, 0, 0, 'Livros de Estudo'),
('kr', 'O Reino de Deus já governa!', 0, 0, 0, 'Livros de Estudo'),
('lfb', 'Aprenda com as Histórias da Bíblia', 0, 0, 0, 'Livros de Estudo'),
('lr', 'Instrutor', 0, 0, 0, 'Livros de Estudo'),
('lvs', 'Continue', 0, 0, 0, 'Livros de Estudo'),
('od', 'Organizados', 0, 0, 0, 'Livros de Estudo'),
('rr', 'Adoração Pura', 0, 0, 0, 'Livros de Estudo'),
('sjj', 'Cante de Coração', 0, 0, 0, 'Livros de Estudo'),
('sjjls', 'Cante de Coração (tamanho grande)', 0, 0, 0, 'Livros de Estudo'),
('sjjyls', 'Cante de Coração — apenas letras', 0, 0, 0, 'Livros de Estudo'),
('yp1', 'Jovens Perguntam, Volume 1', 0, 0, 0, 'Livros de Estudo'),
('yp2', 'Jovens Perguntam, Volume 2', 0, 0, 0, 'Livros de Estudo'),

-- Brochuras
('ay', 'Leitura e Escrita', 0, 0, 0, 'Brochuras'),
('bm', 'Mensagem da Bíblia', 0, 0, 0, 'Brochuras'),
('ed', 'Educação', 0, 0, 0, 'Brochuras'),
('fg', 'Boas Notícias', 0, 0, 0, 'Brochuras'),
('gf', 'Amigo de Deus', 0, 0, 0, 'Brochuras'),
('hf', 'Família', 0, 0, 0, 'Brochuras'),
('hl', 'Vida Feliz', 0, 0, 0, 'Brochuras'),
('jl', 'Vontade de Jeová', 0, 0, 0, 'Brochuras'),
('la', 'Vida Satisfatória', 0, 0, 0, 'Brochuras'),
('lc', 'A Vida — Teve um Criador?', 0, 0, 0, 'Brochuras'),
('ld', 'Escute a Deus', 0, 0, 0, 'Brochuras'),
('lf', 'Origem da Vida', 0, 0, 0, 'Brochuras'),
('mb', 'Minhas Primeiras Lições da Bíblia', 0, 0, 0, 'Brochuras'),
('ol', 'Caminho para a Vida', 0, 0, 0, 'Brochuras'),
('pc', 'Verdadeira Paz e Felicidade', 0, 0, 0, 'Brochuras'),
('ph', 'Caminho', 0, 0, 0, 'Brochuras'),
('rj', 'Volte para Jeová', 0, 0, 0, 'Brochuras'),
('rk', 'Verdadeira Fé', 0, 0, 0, 'Brochuras'),
('sp', 'Espíritos dos Mortos', 0, 0, 0, 'Brochuras'),
('th', 'Melhore', 0, 0, 0, 'Brochuras'),
('wfg', 'Aprenda com a Sabedoria de Jesus', 0, 0, 0, 'Brochuras'),
('wj', 'Por Que Adorar a Deus', 0, 0, 0, 'Brochuras'),
('yc', 'Ensine Seus Filhos', 0, 0, 0, 'Brochuras'),
('ypq', '10 Perguntas', 0, 0, 0, 'Brochuras'),
('AmeAsPessoas', 'Ame as Pessoas (Nova 2024)', 0, 0, 0, 'Brochuras'),
('livretos', 'Outras brochuras e livretos', 0, 0, 0, 'Brochuras'),

-- Formulários
('S-24', 'Recibo', 0, 0, 0, 'Formulários'),
('S-4', 'Relatório de Serviço de Campo', 0, 0, 0, 'Formulários'),
('S-8', 'Registro de Casa em Casa', 0, 0, 0, 'Formulários'),

-- Revistas Despertai!
('g18.1', 'Despertai! Nº 1 2018', 0, 0, 0, 'Revistas Despertai!'),
('g18.2', 'Despertai! Nº 2 2018', 0, 0, 0, 'Revistas Despertai!'),
('g18.3', 'Despertai! Nº 3 2018', 0, 0, 0, 'Revistas Despertai!'),
('g19.1', 'Despertai! Nº 1 2019', 0, 0, 0, 'Revistas Despertai!'),
('g19.2', 'Despertai! Nº 2 2019', 0, 0, 0, 'Revistas Despertai!'),
('g19.3', 'Despertai! Nº 3 2019', 0, 0, 0, 'Revistas Despertai!'),
('g20.1', 'Despertai! Nº 1 2020', 0, 0, 0, 'Revistas Despertai!'),
('g20.2', 'Despertai! Nº 2 2020', 0, 0, 0, 'Revistas Despertai!'),
('g20.3', 'Despertai! Nº 3 2020', 0, 0, 0, 'Revistas Despertai!'),
('g21.1', 'Despertai! Nº 1 2021', 0, 0, 0, 'Revistas Despertai!'),
('g21.2', 'Despertai! Nº 2 2021', 0, 0, 0, 'Revistas Despertai!'),
('g21.3', 'Despertai! Nº 3 2021', 0, 0, 0, 'Revistas Despertai!'),
('g22.1', 'Despertai! Nº 1 2022', 0, 0, 0, 'Revistas Despertai!'),
('g23.1', 'Despertai! Nº 2023', 0, 0, 0, 'Revistas Despertai!'),
('g24.1', 'Despertai! Nº 2024', 0, 0, 0, 'Revistas Despertai!'),

-- Revistas Sentinela
('wp18.1', 'Sentinela Nº 1 2018', 0, 0, 0, 'Revistas Sentinela'),
('wp18.2', 'Sentinela Nº 2 2018', 0, 0, 0, 'Revistas Sentinela'),
('wp18.3', 'Sentinela Nº 3 2018', 0, 0, 0, 'Revistas Sentinela'),
('wp19.1', 'Sentinela Nº 1 2019', 0, 0, 0, 'Revistas Sentinela'),
('wp19.2', 'Sentinela Nº 2 2019', 0, 0, 0, 'Revistas Sentinela'),
('wp19.3', 'Sentinela Nº 3 2019', 0, 0, 0, 'Revistas Sentinela'),
('wp20.1', 'Sentinela Nº 1 2020', 0, 0, 0, 'Revistas Sentinela'),
('wp20.2', 'Sentinela Nº 2 2020', 0, 0, 0, 'Revistas Sentinela'),
('wp20.3', 'Sentinela Nº 3 2020', 0, 0, 0, 'Revistas Sentinela'),
('wp21.1', 'Sentinela Nº 1 2021', 0, 0, 0, 'Revistas Sentinela'),
('wp21.2', 'Sentinela Nº 2 2021', 0, 0, 0, 'Revistas Sentinela'),
('wp21.3', 'Sentinela Nº 3 2021', 0, 0, 0, 'Revistas Sentinela'),
('wp21.6', 'Sentinela Nº 6 2021', 0, 0, 0, 'Revistas Sentinela'),
('wp22.1', 'Sentinela Nº 1 2022', 0, 0, 0, 'Revistas Sentinela'),
('wp24.1', 'Sentinela Nº 2024', 0, 0, 0, 'Revistas Sentinela'),
('público', 'Todas as outras Revistas – edição para o público', 0, 0, 0, 'Revistas Sentinela'),

-- Bíblias
('nwt', 'Tradução do Novo Mundo (tamanho médio)', 350, 1000, 650, 'Bíblias'),
('nwtpkt', 'Tradução do Novo Mundo (edição de bolso)', 0, 0, 0, 'Bíblias'),
('Bíblias', 'Outras Bíblias', 0, 0, 0, 'Bíblias');