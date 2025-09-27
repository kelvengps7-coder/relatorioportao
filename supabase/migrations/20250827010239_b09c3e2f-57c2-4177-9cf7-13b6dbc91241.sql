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
  publication_id UUID NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (publication_id) REFERENCES public.publications(id) ON DELETE CASCADE
);

-- Enable Row Level Security (for public access)
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Publications are viewable by everyone" 
ON public.publications 
FOR SELECT 
USING (true);

CREATE POLICY "Publications can be inserted by everyone" 
ON public.publications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Publications can be updated by everyone" 
ON public.publications 
FOR UPDATE 
USING (true);

CREATE POLICY "Publications can be deleted by everyone" 
ON public.publications 
FOR DELETE 
USING (true);

CREATE POLICY "Movements are viewable by everyone" 
ON public.movements 
FOR SELECT 
USING (true);

CREATE POLICY "Movements can be inserted by everyone" 
ON public.movements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Movements can be updated by everyone" 
ON public.movements 
FOR UPDATE 
USING (true);

CREATE POLICY "Movements can be deleted by everyone" 
ON public.movements 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all 104 publications from the original system
INSERT INTO public.publications (code, name, category, current_stock, total_entries, total_exits) VALUES
-- Revistas
('g24', 'Despertai! - 2024', 'Revistas', 50, 50, 0),
('w24', 'A Sentinela - 2024', 'Revistas', 45, 45, 0),
('g23', 'Despertai! - 2023', 'Revistas', 30, 30, 0),
('w23', 'A Sentinela - 2023', 'Revistas', 25, 25, 0),
('g22', 'Despertai! - 2022', 'Revistas', 20, 20, 0),
('w22', 'A Sentinela - 2022', 'Revistas', 15, 15, 0),

-- Brochuras
('rr', 'Exige o Reino de Deus Sua Lealdade?', 'Brochuras', 30, 30, 0),
('bh', 'O Que a Bíblia Realmente Ensina?', 'Brochuras', 25, 25, 0),
('fg', 'Um Bom Nome Com Deus', 'Brochuras', 20, 20, 0),
('lc', 'Escute o Grande Instrutor', 'Brochuras', 18, 18, 0),
('rq', 'Perguntas dos Jovens - Respostas Práticas', 'Brochuras', 22, 22, 0),
('yp1', 'Perguntas dos Jovens - Volume 1', 'Brochuras', 15, 15, 0),
('yp2', 'Perguntas dos Jovens - Volume 2', 'Brochuras', 12, 12, 0),
('cl', 'Achegue-se a Jeová', 'Brochuras', 28, 28, 0),
('lr', 'Escute Deus e Viva Para Sempre', 'Brochuras', 35, 35, 0),
('lf', 'Escute Deus', 'Brochuras', 20, 20, 0),
('lmd', 'Lições da Vida', 'Brochuras', 25, 25, 0),
('fy', 'O Futuro dos Jovens', 'Brochuras', 16, 16, 0),
('wp', 'O Que É o Propósito da Vida?', 'Brochuras', 24, 24, 0),
('wt', 'Quem É Ensinando Você?', 'Brochuras', 18, 18, 0),

-- Livros
('nwt', 'Tradução do Novo Mundo das Escrituras Sagradas', 'Livros', 15, 15, 0),
('it-1', 'Estudo Perspicaz das Escrituras - Volume 1', 'Livros', 10, 10, 0),
('it-2', 'Estudo Perspicaz das Escrituras - Volume 2', 'Livros', 10, 10, 0),
('w08', 'Mantenha-se no Amor de Deus', 'Livros', 12, 12, 0),
('od', 'Organize-se Para Fazer a Vontade de Jeová', 'Livros', 8, 8, 0),
('be', 'Beneficie-se da Escola do Ministério Teocrático', 'Livros', 6, 6, 0),
('km', 'Nosso Ministério do Reino', 'Livros', 20, 20, 0),
('dp', 'Preste Atenção a Daniel', 'Livros', 5, 5, 0),
('ip-1', 'Isaías - Profecia de Luz - Volume 1', 'Livros', 4, 4, 0),
('ip-2', 'Isaías - Profecia de Luz - Volume 2', 'Livros', 4, 4, 0),
('re', 'Revelação - Seu Grandioso Clímax Está Próximo!', 'Livros', 7, 7, 0),
('jv', 'As Testemunhas de Jeová - Proclamadores do Reino de Deus', 'Livros', 3, 3, 0),
('si', 'Toda Escritura É Inspirada e Proveitosa', 'Livros', 5, 5, 0),
('rs', 'Raciocínios à Base das Escrituras', 'Livros', 8, 8, 0),
('gt', 'O Maior Homem Que Já Viveu', 'Livros', 6, 6, 0),
('kl', 'Conhecimento Que Conduz à Vida Eterna', 'Livros', 4, 4, 0),
('pe', 'Você Pode Viver Para Sempre no Paraíso na Terra', 'Livros', 2, 2, 0),
('tr', 'A Verdade Vos Libertará', 'Livros', 3, 3, 0),
('th', 'A Harpa de Deus', 'Livros', 2, 2, 0),
('ph', 'Foto-Drama da Criação', 'Livros', 1, 1, 0),

-- Tratados
('t-1', 'Por Que Sofrer?', 'Tratados', 100, 100, 0),
('t-2', 'Pode Confiar na Bíblia?', 'Tratados', 100, 100, 0),
('t-3', 'Como Encontrar Esperança', 'Tratados', 100, 100, 0),
('t-4', 'O Reino de Deus', 'Tratados', 95, 95, 0),
('t-5', 'O Que Acontece Quando Morremos?', 'Tratados', 90, 90, 0),
('t-6', 'Onde Encontrar Conforto', 'Tratados', 85, 85, 0),
('t-7', 'Como Ter uma Vida Familiar Feliz', 'Tratados', 80, 80, 0),
('t-8', 'Jeová Se Importa Com Você', 'Tratados', 75, 75, 0),
('t-9', 'Quem Realmente Governa o Mundo?', 'Tratados', 70, 70, 0),
('t-10', 'Quando É Que Haverá um Só Rebanho?', 'Tratados', 65, 65, 0),
('t-11', 'Tem Razão Para Acreditar', 'Tratados', 60, 60, 0),
('t-12', 'Será Que a Religião Faz Diferença?', 'Tratados', 55, 55, 0),
('t-13', 'O Que É o Reino de Deus?', 'Tratados', 50, 50, 0),
('t-14', 'Um Livro Para Toda a Humanidade', 'Tratados', 45, 45, 0),
('t-15', 'Qual É o Sentido da Vida?', 'Tratados', 40, 40, 0),

-- Multimídia
('jw.org', 'Site JW.ORG - Cartão de Apresentação', 'Multimídia', 200, 200, 0),
('jwb', 'JW Broadcasting - Últimas Notícias', 'Multimídia', 50, 50, 0),
('jwl', 'JW Library - Aplicativo', 'Multimídia', 100, 100, 0),
('caleb1', 'Caleb e Sofia - Obedeça a Jeová', 'Multimídia', 25, 25, 0),
('caleb2', 'Caleb e Sofia - Seja Corajoso', 'Multimídia', 25, 25, 0),
('caleb3', 'Caleb e Sofia - Seja Bondoso', 'Multimídia', 25, 25, 0),
('drama1', 'Drama Bíblico - Moisés', 'Multimídia', 15, 15, 0),
('drama2', 'Drama Bíblico - Jesus', 'Multimídia', 15, 15, 0),
('drama3', 'Drama Bíblico - Paulo', 'Multimídia', 15, 15, 0),

-- Formulários e Documentos
('form1', 'Formulário de Publicador Não Batizado', 'Formulários', 50, 50, 0),
('form2', 'Formulário de Publicador Auxiliar', 'Formulários', 40, 40, 0),
('form3', 'Formulário de Pioneiro Regular', 'Formulários', 30, 30, 0),
('form4', 'Formulário de Pioneiro Auxiliar', 'Formulários', 35, 35, 0),
('form5', 'Formulário de Mudança de Congregação', 'Formulários', 25, 25, 0),
('s-3', 'Registro de Reunião de Congregação', 'Formulários', 20, 20, 0),
('s-4', 'Registro de Assistência e Participação', 'Formulários', 20, 20, 0),
('s-8', 'Registro de Publicador de Congregação', 'Formulários', 15, 15, 0),
('s-21', 'Relatório de Atividade de Campo', 'Formulários', 100, 100, 0),
('s-13', 'Formulário de Recomendação', 'Formulários', 10, 10, 0),

-- Convites Especiais
('co1', 'Convite Assembleia de Circuito', 'Convites', 150, 150, 0),
('co2', 'Convite Assembleia Regional', 'Convites', 200, 200, 0),
('co3', 'Convite Congresso Internacional', 'Convites', 100, 100, 0),
('mem1', 'Convite Memorial 2024', 'Convites', 300, 300, 0),
('mem2', 'Convite Memorial 2023', 'Convites', 50, 50, 0),
('esp1', 'Convite Reunião Especial', 'Convites', 75, 75, 0),

-- Publicações Infantis
('my1', 'Minhas Lições Bíblicas', 'Infantis', 30, 30, 0),
('my2', 'Aprenda dos Grandes Instrutores', 'Infantis', 25, 25, 0),
('my3', 'Minhas Primeiras Lições Bíblicas', 'Infantis', 20, 20, 0),
('sgb', 'Venha Ser Meu Seguidor', 'Infantis', 18, 18, 0),
('ycb', 'Livro de Histórias Bíblicas para Crianças', 'Infantis', 22, 22, 0),
('ypa', 'Perguntas dos Jovens - Respostas que Funcionam', 'Infantis', 15, 15, 0),

-- Cânticos e Música
('sjj', 'Cantemos a Jeová (Novo)', 'Cânticos', 40, 40, 0),
('sjjm', 'Cantemos a Jeová - Música (CD)', 'Cânticos', 20, 20, 0),
('sjjv', 'Cantemos a Jeová - Vocal (CD)', 'Cânticos', 20, 20, 0),
('km-cd', 'Reino Melódico - Cânticos Instrumentais', 'Cânticos', 15, 15, 0),
('sng', 'Cante e Seja Feliz', 'Cânticos', 10, 10, 0),

-- Publicações Específicas para Testemunho
('test1', 'Folheto - O Que os Jovens Perguntam', 'Testemunho', 80, 80, 0),
('test2', 'Folheto - Problemas na Família', 'Testemunho', 75, 75, 0),
('test3', 'Folheto - Como Encontrar Felicidade', 'Testemunho', 70, 70, 0),
('test4', 'Folheto - Saúde e Medicina', 'Testemunho', 65, 65, 0),
('test5', 'Folheto - Problemas Financeiros', 'Testemunho', 60, 60, 0),

-- Publicações Especiais
('spec1', 'Anuário das Testemunhas de Jeová 2024', 'Especiais', 5, 5, 0),
('spec2', 'Anuário das Testemunhas de Jeová 2023', 'Especiais', 3, 3, 0),
('spec3', 'Relatório da Obra Mundial', 'Especiais', 8, 8, 0),
('spec4', 'Calendário das Testemunhas de Jeová 2024', 'Especiais', 12, 12, 0),
('spec5', 'Calendário das Testemunhas de Jeová 2023', 'Especiais', 5, 5, 0),

-- Publicações de Estudo Adicionais
('study1', 'Guia de Estudo Pessoal', 'Estudos', 25, 25, 0),
('study2', 'Programa da Escola do Ministério Teocrático', 'Estudos', 30, 30, 0),
('study3', 'Nosso Ministério do Reino - Programa', 'Estudos', 35, 35, 0),
('study4', 'Guia para Reunião Vida e Ministério', 'Estudos', 40, 40, 0),
('study5', 'Esboços para Discursos', 'Estudos', 20, 20, 0);