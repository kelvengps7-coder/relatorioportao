
import { supabase } from './src/integrations/supabase/client.ts';

async function testQrCodeUpdate() {
  console.log('Iniciando teste de atualização de QR Code...');

  try {
    // 1. Buscar uma publicação para usar no teste
    console.log('Buscando uma publicação existente...');
    const { data: publications, error: fetchError } = await supabase
      .from('publications')
      .select('id')
      .limit(1)
      .single();

    if (fetchError || !publications) {
      console.error('Erro ao buscar publicação para o teste:', fetchError);
      throw new Error('Não foi possível encontrar uma publicação para testar.');
    }

    const publicationId = publications.id;
    const testQrCode = `TEST_OK_${Date.now()}`;
    console.log(`Publicação encontrada com ID: ${publicationId}. Usando código de teste: ${testQrCode}`);

    // 2. Tentar atualizar a publicação com o código QR
    console.log('Tentando atualizar a publicação...');
    const { error: updateError } = await supabase
      .from('publications')
      .update({ codigoExternoQR: testQrCode })
      .eq('id', publicationId);

    if (updateError) {
      console.error('Erro ao atualizar a publicação:', updateError);
      throw new Error(`O teste falhou. A atualização retornou um erro: ${updateError.message}`);
    }

    // 3. Sucesso!
    console.log('✅ Sucesso! A publicação foi atualizada sem erros.');
    
    // 4. Limpeza: Remover o código de teste do banco de dados
    console.log('Limpando dados do teste...');
    await supabase
      .from('publications')
      .update({ codigoExternoQR: null })
      .eq('id', publicationId);
    console.log('Limpeza concluída.');

    return { success: true, message: 'O teste foi concluído com sucesso! A coluna `codigoExternoQR` está funcionando corretamente.' };

  } catch (error) {
    console.error('O teste de QR Code falhou.', error);
    return { success: false, message: `O teste falhou: ${error.message}` };
  }
}

testQrCodeUpdate().then(result => {
  console.log('--- Resultado do Teste ---');
  console.log(result.message);
  process.exit(result.success ? 0 : 1);
});
