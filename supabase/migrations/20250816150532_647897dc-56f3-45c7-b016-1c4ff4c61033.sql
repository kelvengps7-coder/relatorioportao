-- Create publications table
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movements table
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Create policies (public access since no authentication)
CREATE POLICY "Publications are publicly accessible" 
ON public.publications 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Movements are publicly accessible" 
ON public.movements 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for publications
CREATE TRIGGER update_publications_updated_at
BEFORE UPDATE ON public.publications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.publications (code, name, category, current_stock, total_entries, total_exits) VALUES
-- Folhetos e Tratados
('7305', 'Convite para Reuniões Cristãs 7305', 'Folhetos e Tratados', 1000, 0, 0),
('jwcd1', 'Cartão de visita do site (imagem da Bíblia aberta)', 'Folhetos e Tratados', 0, 0, 0),
('jwcd4', 'Cartão de visita do site (apenas o logo do jw.org)', 'Folhetos e Tratados', 0, 0, 0),
('jwcd9', 'Cartão de visita do site (curso Bíblico presencial)', 'Folhetos e Tratados', 0, 0, 0),
('jwcd10', 'Cartão de visita do site (curso Bíblico pela internet)', 'Folhetos e Tratados', 0, 0, 0),
('lff', 'Seja Feliz para Sempre! (livro)', 'Folhetos e Tratados', 0, 0, 0),
('lffi', 'Seja Feliz para Sempre! (brochura)', 'Folhetos e Tratados', 0, 0, 0),
('ll', 'Escute e Viva', 'Folhetos e Tratados', 0, 0, 0),
('T-30', 'O Que Você Acha da Bíblia?', 'Folhetos e Tratados', 0, 0, 0),
('T-31', 'O Que Você Espera do Futuro?', 'Folhetos e Tratados', 0, 0, 0),
('T-32', 'Segredo para Família Feliz', 'Folhetos e Tratados', 0, 0, 0),
('T-33', 'Quem controla o Mundo?', 'Folhetos e Tratados', 1000, 0, 0),
('T-34', 'O sofrimento vai acabar?', 'Folhetos e Tratados', 0, 0, 0),
('T-35', 'Voltar a Viver', 'Folhetos e Tratados', 0, 0, 0),
('T-36', 'Reino', 'Folhetos e Tratados', 0, 0, 0),
('T-37', 'Respostas Importantes', 'Folhetos e Tratados', 0, 0, 0),

-- Livros
('be', 'Beneficie-se', 'Livros', 1000, 0, 0),
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
('lr', 'Instrutor', 'Livros', 0, 0, 0),
('lvs', 'Continue', 'Livros', 0, 0, 0),
('od', 'Organizados', 'Livros', 0, 0, 0),
('rr', 'Adoração Pura', 'Livros', 0, 0, 0),
('sjj', 'Cante de Coração', 'Livros', 0, 0, 0),
('sjjls', 'Cante de Coração (tamanho grande)', 'Livros', 0, 0, 0),
('sjjyls', 'Cante de Coração — apenas letras', 'Livros', 0, 0, 0),
('yp1', 'Jovens Perguntam, Volume 1', 'Livros', 0, 0, 0),
('yp2', 'Jovens Perguntam, Volume 2', 'Livros', 0, 0, 0),
('livros', 'Outros', 'Livros', 0, 0, 0),

-- Bíblias
('nwt', 'Tradução do Novo Mundo (tamanho médio)', 'Bíblias', 1000, 0, 50),
('nwtpkt', 'Tradução do Novo Mundo (edição de bolso)', 'Bíblias', 0, 0, 0),
('Bíblias', 'Outras', 'Bíblias', 0, 0, 0),

-- Brochuras
('ay', 'Leitura e Escrita', 'Brochuras', 0, 0, 0),
('bm', 'Mensagem da Bíblia', 'Brochuras', 0, 0, 0),
('ed', 'Educação', 'Brochuras', 0, 0, 0),
('fg', 'Boas Notícias', 'Brochuras', 0, 0, 0),
('gf', 'Amigo de Deus', 'Brochuras', 0, 0, 0),
('hf', 'Família', 'Brochuras', 0, 0, 0),
('hl', 'Vida Feliz', 'Brochuras', 0, 0, 0),
('jl', 'Vontade de Jeová', 'Brochuras', 0, 0, 0),
('la', 'Vida Satisfatória', 'Brochuras', 0, 0, 0),
('lc', 'A Vida — Teve um Criador?', 'Brochuras', 0, 0, 0),
('ld', 'Escute a Deus', 'Brochuras', 0, 0, 0),
('lf', 'Origem da Vida', 'Brochuras', 0, 0, 0),
('mb', 'Minhas Primeiras Lições da Bíblia', 'Brochuras', 0, 0, 0),
('ol', 'Caminho para a Vida', 'Brochuras', 0, 0, 0),
('pc', 'Verdadeira Paz e Felicidade', 'Brochuras', 0, 0, 0),
('ph', 'Caminho', 'Brochuras', 0, 0, 0),
('rj', 'Volte para Jeová', 'Brochuras', 0, 0, 0),
('rk', 'Verdadeira Fé', 'Brochuras', 0, 0, 0),
('sp', 'Espíritos dos Mortos', 'Brochuras', 0, 0, 0),
('th', 'Melhore', 'Brochuras', 0, 0, 0),
('wfg', 'Aprenda com a Sabedoria de Jesus', 'Brochuras', 0, 0, 0),
('wj', 'Por Que Adorar a Deus', 'Brochuras', 0, 0, 0),
('yc', 'Ensine Seus Filhos', 'Brochuras', 0, 0, 0),
('ypq', '10 Perguntas', 'Brochuras', 0, 0, 0),
('amor2024', 'Ame as Pessoas (Nova 2024)', 'Brochuras', 0, 0, 0),
('livretos', 'Outras brochuras e livretos', 'Brochuras', 0, 0, 0),

-- Formulários
('S-24', 'Recibo', 'Formulários', 0, 0, 0),
('S-4', 'Relatório de Serviço de Campo', 'Formulários', 0, 0, 0),
('S-8', 'Registro de Casa em Casa', 'Formulários', 0, 0, 0),

-- Despertai!
('g18.1', 'Despertai! Nº 1 2018', 'Despertai!', 0, 0, 0),
('g18.2', 'Despertai! Nº 2 2018', 'Despertai!', 0, 0, 0),
('g18.3', 'Despertai! Nº 3 2018', 'Despertai!', 0, 0, 0),
('g19.1', 'Despertai! Nº 1 2019', 'Despertai!', 0, 0, 0),
('g19.2', 'Despertai! Nº 2 2019', 'Despertai!', 0, 0, 0),
('g19.3', 'Despertai! Nº 3 2019', 'Despertai!', 0, 0, 0),
('g20.1', 'Despertai! Nº 1 2020', 'Despertai!', 0, 0, 0),
('g20.2', 'Despertai! Nº 2 2020', 'Despertai!', 0, 0, 0),
('g20.3', 'Despertai! Nº 3 2020', 'Despertai!', 0, 0, 0),
('g21.1', 'Despertai! Nº 1 2021', 'Despertai!', 0, 0, 0),
('g21.2', 'Despertai! Nº 2 2021', 'Despertai!', 0, 0, 0),
('g21.3', 'Despertai! Nº 3 2021', 'Despertai!', 0, 0, 0),
('g22.1', 'Despertai! Nº 1 2022', 'Despertai!', 0, 0, 0),
('g24.1', 'Despertai! Nº 2024', 'Despertai!', 0, 0, 0),
('g23.1', 'Despertai! Nº 2023', 'Despertai!', 0, 0, 0),

-- Sentinela
('wp18.1', 'Sentinela Nº 1 2018', 'Sentinela', 0, 0, 0),
('wp18.2', 'Sentinela Nº 2 2018', 'Sentinela', 0, 0, 0),
('wp18.3', 'Sentinela Nº 3 2018', 'Sentinela', 0, 0, 0),
('wp19.1', 'Sentinela Nº 1 2019', 'Sentinela', 0, 0, 0),
('wp19.2', 'Sentinela Nº 2 2019', 'Sentinela', 0, 0, 0),
('wp19.3', 'Sentinela Nº 3 2019', 'Sentinela', 0, 0, 0),
('wp20.1', 'Sentinela Nº 1 2020', 'Sentinela', 0, 0, 0),
('wp20.2', 'Sentinela Nº 2 2020', 'Sentinela', 0, 0, 0),
('wp20.3', 'Sentinela Nº 3 2020', 'Sentinela', 0, 0, 0),
('wp21.1', 'Sentinela Nº 1 2021', 'Sentinela', 0, 0, 0),
('wp21.2', 'Sentinela Nº 2 2021', 'Sentinela', 0, 0, 0),
('wp21.3', 'Sentinela Nº 3 2021', 'Sentinela', 0, 0, 0),
('wp22.1', 'Sentinela Nº 1 2022', 'Sentinela', 0, 0, 0),
('wp21.6', 'Sentinela Nº 6 2021', 'Sentinela', 0, 0, 0),
('wp24.1', 'Sentinela Nº 1 2024', 'Sentinela', 0, 0, 0),
('público', 'Todas as outras Revistas – edição para o público', 'Sentinela', 0, 0, 0);

-- Update stock for nwt based on provided data (1000 initial - 50 exits = 950 current)
UPDATE public.publications SET current_stock = 950 WHERE code = 'nwt';