-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'operador', 'visualizador');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

-- Enable RLS on publications
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- Create movements table
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ));

-- Create RLS policies for publications
CREATE POLICY "Authenticated users can view publications" 
  ON public.publications 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can manage publications" 
  ON public.publications 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'operador')
  ));

-- Create RLS policies for movements
CREATE POLICY "Authenticated users can view movements" 
  ON public.movements 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can manage movements" 
  ON public.movements 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'operador')
  ));

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();