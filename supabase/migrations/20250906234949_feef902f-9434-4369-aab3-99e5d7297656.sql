-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'visualizador' CHECK (role IN ('admin', 'estoquista', 'servo de balcao', 'visualizador')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create publications table for stock management
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create stock movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  user_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user can edit
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'estoquista', 'servo de balcao') FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles table
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- RLS Policies for publications table
CREATE POLICY "Users can view publications" ON public.publications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert publications" ON public.publications
  FOR INSERT WITH CHECK (public.can_edit());

CREATE POLICY "Editors can update publications" ON public.publications
  FOR UPDATE USING (public.can_edit());

CREATE POLICY "Admins can delete publications" ON public.publications
  FOR DELETE USING (public.is_admin());

-- RLS Policies for stock_movements table
CREATE POLICY "Users can view stock movements" ON public.stock_movements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert stock movements" ON public.stock_movements
  FOR INSERT WITH CHECK (public.can_edit());

CREATE POLICY "Editors can update stock movements" ON public.stock_movements
  FOR UPDATE USING (public.can_edit());

CREATE POLICY "Admins can delete stock movements" ON public.stock_movements
  FOR DELETE USING (public.is_admin());

-- RLS Policies for audit_logs table
CREATE POLICY "Users can view audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || NEW.id::text),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'visualizador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update stock counts
CREATE OR REPLACE FUNCTION public.update_stock_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.movement_type = 'entrada' THEN
      UPDATE public.publications 
      SET 
        current_stock = current_stock + NEW.quantity,
        total_entries = total_entries + NEW.quantity
      WHERE id = NEW.publication_id;
    ELSIF NEW.movement_type = 'saida' THEN
      UPDATE public.publications 
      SET 
        current_stock = current_stock - NEW.quantity,
        total_exits = total_exits + NEW.quantity
      WHERE id = NEW.publication_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update stock counts
CREATE TRIGGER update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_counts();