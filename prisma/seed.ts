import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// IDs fixos (UUIDs) para consistência entre Front e Back
const COMPANY_ID = 'da92bbf3-4613-4bb4-bc70-e696f049d53c';

const USER_ADMIN_ID = '11111111-1111-1111-1111-111111111111';
const USER_MANAGER_ID = '22222222-2222-2222-2222-222222222222';
const USER_OPERATOR_ID = '33333333-3333-3333-3333-333333333333';
const USER_VIEWER_ID = '44444444-4444-4444-4444-444444444444';

const TMPL_1_ID = '9c1d0f5e-1111-460d-8547-0bfa7c58ab01';
const TMPL_2_ID = '9c1d0f5e-2222-460d-8547-0bfa7c58ab02';
const TMPL_3_ID = '9c1d0f5e-3333-460d-8547-0bfa7c58ab03';
const TMPL_4_ID = '9c1d0f5e-4444-460d-8547-0bfa7c58ab04';
const TMPL_5_ID = '9c1d0f5e-5555-460d-8547-0bfa7c58ab05';
const TMPL_6_ID = '9c1d0f5e-6666-460d-8547-0bfa7c58ab06';

const CTR_1_ID = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa';
const CTR_2_ID = 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa';
const CTR_3_ID = 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa';
const CTR_4_ID = 'aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa';
const CTR_5_ID = 'aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa';

const OBR_1_ID = 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';
const OBR_2_ID = 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb';
const OBR_3_ID = 'bbbbbbbb-3333-3333-3333-bbbbbbbbbbbb';

const PO_1_ID = 'cccccccc-1111-1111-1111-cccccccccccc';
const PO_2_ID = 'cccccccc-2222-2222-2222-cccccccccccc';

async function main() {
  console.log('🌱 Iniciando seed dos dados reais do frontend...');

  // ─── Company ──────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      id: COMPANY_ID,
      name: 'Constructora Sólida Ltda',
      cnpj: '12345678000190',
      email: 'diretoria@solida.com.br',
      phone: '1140028922',
      address: 'Rua das Flores, 123, São Paulo - SP',
    },
  });
  console.log(`✅ Empresa: ${company.name}`);

  // ─── Users ────────────────────────────────────────────────────────────────
  const defaultPasswordHash = await bcrypt.hash('senha123!', 12);

  const admin = await prisma.user.upsert({
    where: { email_company_id: { email: 'admin@solida.com.br', company_id: company.id } },
    update: {},
    create: {
      id: USER_ADMIN_ID,
      company_id: company.id,
      name: 'Admin Sólida',
      email: 'admin@solida.com.br',
      password: defaultPasswordHash,
      role: 'ADMIN',
      active: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email_company_id: { email: 'marcos@solida.com.br', company_id: company.id } },
    update: {},
    create: {
      id: USER_MANAGER_ID,
      company_id: company.id,
      name: 'Marcos Rezende',
      email: 'marcos@solida.com.br',
      password: defaultPasswordHash,
      role: 'MANAGER',
      active: true,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email_company_id: { email: 'mariana.costa@solida.com.br', company_id: company.id } },
    update: {},
    create: {
      id: USER_OPERATOR_ID,
      company_id: company.id,
      name: 'Mariana Costa',
      email: 'mariana.costa@solida.com.br',
      password: defaultPasswordHash,
      role: 'OPERATOR',
      active: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email_company_id: { email: 'ricardo@solida.com.br', company_id: company.id } },
    update: {},
    create: {
      id: USER_VIEWER_ID,
      company_id: company.id,
      name: 'Ricardo Dias',
      email: 'ricardo@solida.com.br',
      password: defaultPasswordHash,
      role: 'VIEWER',
      active: false,
    },
  });
  console.log(`✅ Usuários criados com senha padrão 'senha123!'`);

  // ─── Templates ────────────────────────────────────────────────────────────
  // Limpar os templates antigos desta empresa para criar no formato exato
  const existingTemplates = await prisma.contractTemplate.findMany({ where: { company_id: company.id } });
  for (const t of existingTemplates) {
    await prisma.contractTemplateField.deleteMany({ where: { template_id: t.id } });
    await prisma.contractTemplate.delete({ where: { id: t.id } });
  }

  const tmpl1 = await prisma.contractTemplate.create({
    data: {
      id: TMPL_1_ID,
      company_id: company.id,
      name: 'Prestação de Serviço de Engenharia',
      type: 'SERVICO',
      description: 'Template de contrato padrão para consultoria e suporte técnico em engenharia civil.',
      html_content: `
      <div style="font-family: inherit; line-height: 1.6; color: #1e293b;">
        <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 24px; color: #1e3a5f;">{{titulo_contrato}}</h2>
        
        <p>Pelo presente instrumento particular, de um lado <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o n° <strong>{{cnpj_contratante}}</strong>, neste ato representada conforme seus poderes estatutários, doravante denominada <strong>CONTRATANTE</strong>.</p>
        
        <p>E de outro lado, <strong>{{parte_relacionada}}</strong>, doravante denominada <strong>CONTRATADA</strong>, devidamente qualificada pelo profissional <strong>{{nome_consultor}}</strong>, portador do CREA nº <strong>{{crea_registro}}</strong>.</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 18px; color: #1e3a5f;">CLÁUSULA PRIMEIRA - OBJETO</h3>
        <p>O presente contrato tem por objeto a prestação de serviços de engenharia civil voltados para: <em>{{escopo_detalhado}}</em>.</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 18px; color: #1e3a5f;">CLÁUSULA SEGUNDA - VALORES E CONDIÇÕES</h3>
        <p>Pelo serviço efetivamente prestado, a CONTRATANTE pagará à CONTRATADA o montante global de <strong>R$ {{valor_total}}</strong>, ou sob parcelas operadas no valor de <strong>R$ {{valor_mensal}}</strong> vigentes até a data de encerramento contratual informada em <strong>{{data_fim}}</strong>.</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 18px; color: #1e3a5f;">CLÁUSULA TERCEIRA - ASSINATURAS</h3>
        <p>E por estarem de pleno acordo, firmam as partes o presente instrumento por assinatura digital certificada.</p>
        
        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center;">
            <p><strong>CONTRATANTE</strong><br/>{{empresa_contratante}}</p>
          </div>
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center;">
            <p><strong>CONTRATADA</strong><br/>{{parte_relacionada}}</p>
          </div>
        </div>
      </div>
      `,
      fields: {
        create: [
          { label: 'Nome do Consultor', field_key: 'nome_consultor', field_type: 'TEXT', required: true, order: 1 },
          { label: 'Registro CREA', field_key: 'crea_registro', field_type: 'TEXT', required: true, order: 2 },
          { label: 'Escopo detalhado', field_key: 'escopo_detalhado', field_type: 'TEXTAREA', required: true, order: 3 },
          { label: 'Valor da Parcela Mensal', field_key: 'valor_mensal', field_type: 'NUMBER', required: true, order: 4 },
        ],
      },
    },
  });

  const tmpl2 = await prisma.contractTemplate.create({
    data: {
      id: TMPL_2_ID,
      company_id: company.id,
      name: 'Locação de Equipamento Pesado',
      type: 'LOCACAO',
      description: 'Contrato de locação comercial de escavadeiras, tratores ou betoneiras por período determinado.',
      html_content: `
      <div style="font-family: inherit; line-height: 1.6; color: #1e293b;">
        <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 24px; color: #1e3a5f;">{{titulo_contrato}}</h2>
        
        <p><strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, filial sediada com CNPJ <strong>{{cnpj_contratante}}</strong>.</p>
        <p><strong>CONTRATADA / LOCADORA:</strong> <strong>{{parte_relacionada}}</strong>.</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 18px; color: #1e3a5f;">OBJETO</h3>
        <p>A LOCADORA cede para locação temporária o equipamento <strong>{{modelo_equipamento}}</strong>, a ser instalado e operado na localidade de destinação: <strong>{{local_obra}}</strong>, respeitando a franquia estipulada de <strong>{{franquia_horas}} horas</strong> mensais excedentes.</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 18px; color: #1e3a5f;">VIGÊNCIA E VALOR</h3>
        <p>A taxa de locação pactuada é de <strong>R$ {{valor_total}}</strong>, compreendida no período de <strong>{{data_inicio}}</strong> até <strong>{{data_fim}}</strong>.</p>
        
        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center;">
            <p><strong>LOCATÁRIO (CONTRATANTE)</strong></p>
          </div>
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center;">
            <p><strong>LOCADOR (CONTRATADA)</strong></p>
          </div>
        </div>
      </div>
      `,
      fields: {
        create: [
          { label: 'Equipamento e Modelo', field_key: 'modelo_equipamento', field_type: 'TEXT', required: true, order: 1 },
          { label: 'Franquia de Horas (Mensal)', field_key: 'franquia_horas', field_type: 'NUMBER', required: true, order: 2 },
          { label: 'Local de Entrega', field_key: 'local_obra', field_type: 'TEXT', required: true, order: 3 },
        ],
      },
    },
  });
  // ─── Novos Templates Detalhados ──────────────────────────────────────────
  const tmpl3 = await prisma.contractTemplate.create({
    data: {
      id: TMPL_3_ID,
      company_id: company.id,
      name: 'Prestação de Serviço Profissional',
      type: 'SERVICO',
      description: 'Contrato completo para prestação de serviços profissionais especializados, com cláusulas de objeto, pagamento, vigência, confidencialidade e foro.',
      html_content: `
      <div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
        <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
          INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS
        </h2>

        <p>Pelo presente instrumento particular, de um lado:</p>
        <p style="margin-left:30px;">
          <strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{{cnpj_contratante}}</strong>, com sede no endereço cadastrado no sistema.
        </p>
        <p style="margin-left:30px;">
          <strong>CONTRATADO(A):</strong> <strong>{{parte_relacionada}}</strong>, prestador(a) de serviços, CPF/CNPJ nº <strong>{{cpf_cnpj_prestador}}</strong>, especializado(a) na área de <strong>{{area_especialidade}}</strong>.
        </p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA PRIMEIRA – DO OBJETO</h3>
        <p>O presente instrumento tem por objeto a prestação de serviços profissionais especializados consistentes em: <strong>{{objeto_servico}}</strong>. Os serviços serão executados conforme proposta técnica e cronograma definidos em Anexo I deste contrato.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEGUNDA – DO PRAZO E LOCAL DE EXECUÇÃO</h3>
        <p>A execução dos serviços ora contratados terá início na data de <strong>{{data_inicio}}</strong> e deverá ser concluída até <strong>{{data_fim}}</strong>, podendo ser prorrogada mediante aditivo escrito. Os serviços serão executados primordialmente no local: <strong>{{local_execucao}}</strong>.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA TERCEIRA – DOS VALORES E PAGAMENTO</h3>
        <p>Pela prestação dos serviços objeto deste contrato, a CONTRATANTE pagará ao CONTRATADO o valor total de <strong>R$ {{valor_total}}</strong>, dividido em <strong>{{numero_parcelas}}</strong> parcelas mensais iguais e sucessivas, conforme a forma de pagamento: <strong>{{forma_pagamento}}</strong>.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUARTA – DAS OBRIGAÇÕES DO CONTRATADO</h3>
        <p>O CONTRATADO obriga-se a: (i) executar os serviços com toda a diligência, qualidade e técnica requeridas; (ii) manter sigilo sobre todas as informações, documentos e dados obtidos em razão deste contrato; (iii) responsabilizar-se por todos os encargos trabalhistas, previdenciários e fiscais decorrentes da prestação dos serviços.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUINTA – DA RESCISÃO E PENALIDADES</h3>
        <p>O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias. Em caso de rescisão imotivada, a parte infratora pagará à outra multa compensatória de <strong>{{multa_rescisao}}</strong>.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEXTA – DO FORO ELEITO</h3>
        <p>Fica eleito o Foro da Comarca de <strong>{{cidade_foro}}</strong> para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, com expressa exclusão de qualquer outro.</p>

        <p style="margin-top:40px;">E, por estarem de pleno acordo, firmam o presente instrumento em duas vias de igual teor e forma, por meio de assinatura eletrônica certificada.</p>

        <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>CONTRATANTE</strong><br/>
              <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
            </div>
          </div>
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>CONTRATADO(A)</strong><br/>
              <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
            </div>
          </div>
        </div>
      </div>
      `,
      fields: {
        create: [
          { label: 'CPF/CNPJ do Prestador', field_key: 'cpf_cnpj_prestador', field_type: 'TEXT', required: true, order: 1 },
          { label: 'Área de Especialidade (Ex: Engenharia Civil)', field_key: 'area_especialidade', field_type: 'TEXT', required: true, order: 2 },
          { label: 'Descrição Detalhada do Serviço', field_key: 'objeto_servico', field_type: 'TEXTAREA', required: true, order: 3 },
          { label: 'Local de Execução dos Serviços', field_key: 'local_execucao', field_type: 'TEXT', required: true, order: 4 },
          { label: 'Número de Parcelas', field_key: 'numero_parcelas', field_type: 'NUMBER', required: true, order: 5 },
          { label: 'Forma de Pagamento (Ex: Transferência bancária)', field_key: 'forma_pagamento', field_type: 'TEXT', required: true, order: 6 },
          { label: 'Multa Rescisória (Ex: 10% do valor restante)', field_key: 'multa_rescisao', field_type: 'TEXT', required: true, order: 7 },
          { label: 'Cidade do Foro Competente', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 8 },
        ],
      },
    },
  });

  const tmpl4 = await prisma.contractTemplate.create({
    data: {
      id: TMPL_4_ID,
      company_id: company.id,
      name: 'Contrato de Trabalho Completo',
      type: 'TRABALHO',
      description: 'Contrato individual de trabalho completo com cláusulas de função, jornada, remuneração, benefícios, período de experiência e encargos legais (CLT).',
      html_content: `
      <div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
        <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
          CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO INDETERMINADO
        </h2>

        <p>Pelo presente instrumento, de um lado:</p>
        <p style="margin-left:30px;">
          <strong>EMPREGADORA:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº <strong>{{cnpj_contratante}}</strong>, com sede no endereço cadastrado no sistema.
        </p>
        <p style="margin-left:30px;">
          <strong>EMPREGADO(A):</strong> <strong>{{parte_relacionada}}</strong>, nacionalidade <strong>{{nacionalidade_empregado}}</strong>, estado civil <strong>{{estado_civil_empregado}}</strong>, portador(a) do CPF sob o nº <strong>{{cpf_empregado}}</strong>, RG nº <strong>{{rg_empregado}}</strong>, residente à <strong>{{endereco_empregado}}</strong>.
        </p>

        <p>As partes acima qualificadas celebram o presente Contrato Individual de Trabalho, que se regerá pela Consolidação das Leis do Trabalho (CLT) e pelas cláusulas seguintes:</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA PRIMEIRA – DA ADMISSÃO E FUNÇÃO</h3>
        <p>O(A) EMPREGADO(A) é admitido(a) a partir de <strong>{{data_inicio}}</strong> para exercer a função de <strong>{{cargo_funcao}}</strong>, no departamento de <strong>{{departamento}}</strong>, realizando todas as tarefas correlatas e inerentes ao cargo, conforme instruções e supervisão da empresa.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEGUNDA – DO PERÍODO DE EXPERIÊNCIA</h3>
        <p>Nos primeiros <strong>{{periodo_experiencia}}</strong> dias, o(a) EMPREGADO(A) estará sujeito(a) ao período de experiência, conforme previsto no art. 443, § 1º da CLT, podendo ser rescindido o presente contrato sem ônus para qualquer das partes nesse interregno.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA TERCEIRA – DA JORNADA DE TRABALHO</h3>
        <p>A jornada de trabalho acordada será de <strong>{{jornada_trabalho}}</strong>, nos dias úteis de segunda a sexta-feira, respeitados os limites legais e constitucionais de duração do trabalho. As horas extraordinárias, quando autorizadas, serão remuneradas conforme a legislação vigente.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUARTA – DA REMUNERAÇÃO E BENEFÍCIOS</h3>
        <p>Como contraprestação pelos serviços prestados, a EMPREGADORA pagará ao(à) EMPREGADO(A) o salário base mensal de <strong>R$ {{valor_total}}</strong>, sujeito aos descontos previstos em lei (INSS, IRRF e outros). Adicionalmente, o(a) EMPREGADO(A) fará jus aos benefícios de: <strong>{{beneficios_concedidos}}</strong>.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUINTA – DO LOCAL DE TRABALHO</h3>
        <p>Os serviços serão prestados no estabelecimento localizado em: <strong>{{local_trabalho}}</strong>, podendo a empresa, por necessidade operacional, transferir o(a) EMPREGADO(A) para outros estabelecimentos da empresa, respeitada a legislação aplicável.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEXTA – DAS DISPOSIÇÕES GERAIS</h3>
        <p>O(A) EMPREGADO(A) declara estar ciente das políticas internas, regulamentos e Código de Conduta da empresa, comprometendo-se a observá-los rigorosamente. As partes elegem a Vara do Trabalho da Comarca de <strong>{{cidade_foro}}</strong> para dirimir quaisquer litígios decorrentes deste contrato.</p>

        <p style="margin-top:40px; text-align:right;"><strong>{{cidade_foro}}</strong>, em <strong>{{data_inicio}}</strong>.</p>

        <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>EMPREGADORA</strong><br/>
              <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
            </div>
          </div>
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>EMPREGADO(A)</strong><br/>
              <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
            </div>
          </div>
        </div>
      </div>
      `,
      fields: {
        create: [
          { label: 'CPF do Empregado(a)', field_key: 'cpf_empregado', field_type: 'TEXT', required: true, order: 1 },
          { label: 'RG do Empregado(a)', field_key: 'rg_empregado', field_type: 'TEXT', required: true, order: 2 },
          { label: 'Nacionalidade', field_key: 'nacionalidade_empregado', field_type: 'TEXT', required: true, order: 3 },
          { label: 'Estado Civil', field_key: 'estado_civil_empregado', field_type: 'TEXT', required: true, order: 4 },
          { label: 'Endereço Residencial do Empregado', field_key: 'endereco_empregado', field_type: 'TEXTAREA', required: true, order: 5 },
          { label: 'Cargo / Função', field_key: 'cargo_funcao', field_type: 'TEXT', required: true, order: 6 },
          { label: 'Departamento', field_key: 'departamento', field_type: 'TEXT', required: false, order: 7 },
          { label: 'Período de Experiência (Ex: 45 dias)', field_key: 'periodo_experiencia', field_type: 'TEXT', required: true, order: 8 },
          { label: 'Jornada de Trabalho (Ex: 44h semanais, Segunda a Sexta das 8h às 17h)', field_key: 'jornada_trabalho', field_type: 'TEXT', required: true, order: 9 },
          { label: 'Benefícios Concedidos (Ex: Vale-refeição, plano de saúde)', field_key: 'beneficios_concedidos', field_type: 'TEXT', required: false, order: 10 },
          { label: 'Local de Trabalho (endereço do estabelecimento)', field_key: 'local_trabalho', field_type: 'TEXT', required: true, order: 11 },
          { label: 'Cidade do Foro Trabalhista', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 12 },
        ],
      },
    },
  });

  const tmpl5 = await prisma.contractTemplate.create({
    data: {
      id: TMPL_5_ID,
      company_id: company.id,
      name: 'Contrato de Execução de Obra Civil',
      type: 'OBRA',
      description: 'Contrato de empreitada completo para execução de obra civil, com definição de escopo, cronograma, responsabilidade técnica, medições e penalidades por atraso.',
      html_content: `
      <div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
        <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
          CONTRATO DE EMPREITADA GLOBAL DE OBRA CIVIL
        </h2>

        <p>Pelo presente instrumento particular, de um lado:</p>
        <p style="margin-left:30px;">
          <strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº <strong>{{cnpj_contratante}}</strong>, com sede no endereço cadastrado no sistema; e, de outro lado,
        </p>
        <p style="margin-left:30px;">
          <strong>CONTRATADA / EMPREITEIRA:</strong> <strong>{{parte_relacionada}}</strong>, inscrita no CNPJ/CPF sob o nº <strong>{{cpf_cnpj_contratada}}</strong>, com sede em <strong>{{endereco_contratada}}</strong>, neste ato representada por seu(sua) representante legal, Sr(a). <strong>{{representante_contratada}}</strong>.
        </p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA PRIMEIRA – DO OBJETO E ESCOPO DA OBRA</h3>
        <p>O objeto do presente contrato consiste na execução, pela CONTRATADA, dos seguintes serviços e obras: <strong>{{descricao_obra}}</strong>. A obra será executada no imóvel situado no endereço: <strong>{{endereco_obra}}</strong>.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEGUNDA – DOS PRAZOS DE EXECUÇÃO</h3>
        <p>As obras terão início oficial em <strong>{{data_inicio}}</strong> e a entrega definitiva com emissão do Termo de Recebimento está prevista para <strong>{{data_fim}}</strong>. O cronograma físico-financeiro detalhado constará do Anexo II deste instrumento. Em caso de atraso injustificado, aplicar-se-á multa diária de <strong>{{multa_atraso_diaria}}</strong>, limitada a <strong>{{teto_multa}}</strong> do valor total do contrato.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA TERCEIRA – DO VALOR E CONDIÇÕES DE PAGAMENTO</h3>
        <p>Pela execução integral das obras, a CONTRATANTE pagará à CONTRATADA o valor global e fixo de <strong>R$ {{valor_total}}</strong>. Os pagamentos serão liberados mediante aprovação das medições mensais, emitidas pelo Responsável Técnico indicado pela CONTRATANTE, conforme avanço físico verificado em campo.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUARTA – DA RESPONSABILIDADE TÉCNICA</h3>
        <p>A responsabilidade técnica pela execução das obras perante os órgãos reguladores, CREA/CAU e poder público fica a cargo exclusivo do(a) Sr(a). <strong>{{responsavel_tecnico}}</strong>, devidamente registrado(a) no CREA/CAU sob o nº <strong>{{registro_crea_cau}}</strong>. A CONTRATADA deverá providenciar a ART/RRT junto ao órgão competente antes do início dos serviços.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUINTA – DOS MATERIAIS E MÃO DE OBRA</h3>
        <p>Salvo disposição em contrário expressamente prevista em Anexo específico, todos os materiais, equipamentos e mão de obra necessários à execução da obra correrão por conta exclusiva da CONTRATADA, que se responsabiliza pela qualidade e conformidade técnica dos mesmos com as normas ABNT aplicáveis.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEXTA – DO FORO ELEITO</h3>
        <p>Para dirimir litígios decorrentes deste contrato, fica eleito o Foro da Comarca de <strong>{{cidade_foro}}</strong>, com expressa renúncia a qualquer outro, por mais privilegiado que seja.</p>

        <p style="margin-top:40px;">E, por estarem assim de comum acordo, assinam o presente instrumento por meio de assinatura eletrônica certificada.</p>

        <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>CONTRATANTE</strong><br/>
              <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
            </div>
          </div>
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>CONTRATADA / EMPREITEIRA</strong><br/>
              <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
            </div>
          </div>
        </div>
      </div>
      `,
      fields: {
        create: [
          { label: 'CNPJ/CPF da Empreiteira', field_key: 'cpf_cnpj_contratada', field_type: 'TEXT', required: true, order: 1 },
          { label: 'Endereço da Empreiteira', field_key: 'endereco_contratada', field_type: 'TEXT', required: true, order: 2 },
          { label: 'Nome do Representante Legal da Empreiteira', field_key: 'representante_contratada', field_type: 'TEXT', required: true, order: 3 },
          { label: 'Descrição Detalhada da Obra e Serviços', field_key: 'descricao_obra', field_type: 'TEXTAREA', required: true, order: 4 },
          { label: 'Endereço Completo da Obra', field_key: 'endereco_obra', field_type: 'TEXTAREA', required: true, order: 5 },
          { label: 'Multa Diária por Atraso (Ex: R$ 1.000,00)', field_key: 'multa_atraso_diaria', field_type: 'TEXT', required: true, order: 6 },
          { label: 'Teto da Multa (Ex: 10%)', field_key: 'teto_multa', field_type: 'TEXT', required: true, order: 7 },
          { label: 'Nome do Responsável Técnico (Eng./Arq.)', field_key: 'responsavel_tecnico', field_type: 'TEXT', required: true, order: 8 },
          { label: 'Nº de Registro CREA/CAU do Responsável Técnico', field_key: 'registro_crea_cau', field_type: 'TEXT', required: true, order: 9 },
          { label: 'Cidade do Foro Competente', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 10 },
        ],
      },
    },
  });

  const tmpl6 = await prisma.contractTemplate.create({
    data: {
      id: TMPL_6_ID,
      company_id: company.id,
      name: 'Contrato de Locação de Imóvel Completo',
      type: 'LOCACAO',
      description: 'Contrato de locação de imóvel urbano completo com cláusulas de objeto, finalidade, valor, reajuste, garantia locatícia, obrigações das partes e benfeitorias.',
      html_content: `
      <div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
        <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
          CONTRATO DE LOCAÇÃO DE IMÓVEL URBANO
        </h2>

        <p>Pelo presente instrumento particular, de um lado:</p>
        <p style="margin-left:30px;">
          <strong>LOCADOR(A):</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº <strong>{{cnpj_contratante}}</strong>, doravante denominada simplesmente LOCADORA.
        </p>
        <p style="margin-left:30px;">
          <strong>LOCATÁRIO(A):</strong> <strong>{{parte_relacionada}}</strong>, estado civil <strong>{{estado_civil_locatario}}</strong>, portador(a) do CPF/CNPJ sob o nº <strong>{{cpf_cnpj_locatario}}</strong>, residente ou com sede em <strong>{{endereco_locatario}}</strong>.
        </p>

        <p>As partes acima qualificadas têm entre si justo e acordado o presente Contrato de Locação de Imóvel Urbano, regido pela Lei nº 8.245/1991 (Lei do Inquilinato) e pelas cláusulas seguintes:</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA PRIMEIRA – DO OBJETO E FINALIDADE</h3>
        <p>O objeto do presente contrato é a locação do imóvel situado no endereço: <strong>{{endereco_imovel}}</strong>, composto por <strong>{{descricao_imovel}}</strong>. O imóvel será destinado exclusivamente para fins <strong>{{finalidade_locacao}}</strong>, sendo vedada qualquer outra utilização sem expressa autorização escrita do(a) LOCADOR(A).</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEGUNDA – DO PRAZO DA LOCAÇÃO</h3>
        <p>O prazo da locação é de <strong>{{prazo_locacao}}</strong>, com início em <strong>{{data_inicio}}</strong> e término em <strong>{{data_fim}}</strong>. Após o término do prazo, persistindo a posse do LOCATÁRIO com a anuência do LOCADOR, a locação converter-se-á em prazo indeterminado.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA TERCEIRA – DO ALUGUEL E REAJUSTE</h3>
        <p>O aluguel mensal ajustado entre as partes é de <strong>R$ {{valor_total}}</strong>, a ser pago impreterivelmente até o dia <strong>{{dia_vencimento}}</strong> de cada mês pelo banco de preferência do LOCATÁRIO, mediante depósito ou transferência na conta indicada pelo LOCADOR. O aluguel será reajustado anualmente pelo índice <strong>{{indice_reajuste}}</strong> acumulado no período.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUARTA – DA GARANTIA LOCATÍCIA</h3>
        <p>Como garantia do fiel cumprimento das obrigações deste contrato, o LOCATÁRIO presta a seguinte garantia: <strong>{{tipo_garantia}}</strong>, no valor equivalente a <strong>{{valor_garantia}}</strong>, que será restituída ao final da locação, deduzidos eventuais débitos não quitados.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA QUINTA – DAS OBRIGAÇÕES DO LOCATÁRIO</h3>
        <p>O LOCATÁRIO obriga-se a: (i) pagar pontualmente o aluguel e demais encargos; (ii) usar o imóvel para o fim estipulado neste contrato; (iii) conservar o imóvel no estado em que recebeu; (iv) pagar as contas de consumo (água, energia elétrica, gás, telefone e internet) e o condomínio durante a vigência da locação; (v) não realizar obras ou modificações sem autorização prévia e escrita do LOCADOR.</p>

        <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">CLÁUSULA SEXTA – DO FORO ELEITO</h3>
        <p>As partes elegem o Foro da Comarca de <strong>{{cidade_foro}}</strong> para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, com expressa renúncia a qualquer outro.</p>

        <p style="margin-top:40px;">E, por estarem assim justas e contratadas, assinam o presente instrumento por meio de assinatura eletrônica certificada.</p>

        <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>LOCADOR(A)</strong><br/>
              <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
            </div>
          </div>
          <div>
            <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
              <strong>LOCATÁRIO(A)</strong><br/>
              <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
            </div>
          </div>
        </div>
      </div>
      `,
      fields: {
        create: [
          { label: 'Estado Civil do Locatário', field_key: 'estado_civil_locatario', field_type: 'TEXT', required: true, order: 1 },
          { label: 'CPF/CNPJ do Locatário', field_key: 'cpf_cnpj_locatario', field_type: 'TEXT', required: true, order: 2 },
          { label: 'Endereço do Locatário', field_key: 'endereco_locatario', field_type: 'TEXTAREA', required: true, order: 3 },
          { label: 'Endereço Completo do Imóvel Locado', field_key: 'endereco_imovel', field_type: 'TEXTAREA', required: true, order: 4 },
          { label: 'Descrição do Imóvel (Ex: 3 quartos, sala, 2 banheiros)', field_key: 'descricao_imovel', field_type: 'TEXT', required: true, order: 5 },
          { label: 'Finalidade da Locação (Ex: Residencial / Comercial)', field_key: 'finalidade_locacao', field_type: 'TEXT', required: true, order: 6 },
          { label: 'Prazo da Locação (Ex: 30 meses)', field_key: 'prazo_locacao', field_type: 'TEXT', required: true, order: 7 },
          { label: 'Dia de Vencimento do Aluguel (Ex: 10)', field_key: 'dia_vencimento', field_type: 'NUMBER', required: true, order: 8 },
          { label: 'Índice de Reajuste Anual (Ex: IGPM, IPCA)', field_key: 'indice_reajuste', field_type: 'TEXT', required: true, order: 9 },
          { label: 'Tipo de Garantia Locatícia (Ex: Caução, Fiador, Seguro)', field_key: 'tipo_garantia', field_type: 'TEXT', required: true, order: 10 },
          { label: 'Valor da Garantia (Ex: 3 meses de aluguel)', field_key: 'valor_garantia', field_type: 'TEXT', required: true, order: 11 },
          { label: 'Cidade do Foro Competente', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 12 },
        ],
      },
    },
  });

  console.log('✅ Templates de Contrato criados');

  // ─── Contracts ────────────────────────────────────────────────────────────
  // Limpar contratos e dependentes
  await prisma.signatureRequest.deleteMany({ where: { contract: { company_id: company.id } } });
  await prisma.contract.deleteMany({ where: { company_id: company.id } });

  const contractsData = [
    {
      id: CTR_1_ID,
      title: 'Consultoria Estrutural Fundações',
      related_party: 'Geotécnica Solo Forte S/S',
      type: 'SERVICO' as const,
      value: new Prisma.Decimal('45000.00'),
      start_date: new Date('2026-01-10'),
      end_date: new Date('2026-06-15'),
      status: 'ACTIVE' as const,
      template_id: TMPL_1_ID,
      field_values: {
        nome_consultor: 'Dr. Arthur Mendes',
        crea_registro: 'CREA-PR 9821-D',
        escopo_detalhado: 'Análise de sondagem SPT e cálculo estrutural de fundações do bloco A e B.',
        valor_mensal: '9000',
      },
      html_content: 'Carregado de template estrutural.',
    },
    {
      id: CTR_2_ID,
      title: 'Locação Escavadeira Hidráulica 20T',
      related_party: 'RentMachines Engenharia & Locações',
      type: 'LOCACAO' as const,
      value: new Prisma.Decimal('120000.00'),
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-12-31'),
      status: 'ACTIVE' as const,
      template_id: TMPL_2_ID,
      field_values: {
        modelo_equipamento: 'Escavadeira CAT 320 Next Gen',
        franquia_horas: '160',
        local_obra: 'Sede Corporativa ACME',
      },
      html_content: 'Contrato de locação comercial para escavadeira hidráulica de grande porte.',
    },
    {
      id: CTR_3_ID,
      title: 'Fornecimento de Cimento Campeão Votoran',
      related_party: 'Distribuidora São Paulo Matcon',
      type: 'OBRA' as const,
      value: new Prisma.Decimal('85400.00'),
      start_date: new Date('2026-05-15'),
      end_date: new Date('2026-07-15'),
      status: 'PENDING_SIGNATURE' as const,
      field_values: {},
      html_content: `
      <div style="font-family: inherit; line-height: 1.6; color: #1e293b;">
        <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 24px; color: #1e3a5f;">CONTRATO DE FORNECIMENTO DE MATERIAIS - CIMENTO COPO</h2>
        <p>A <strong>Constructora Sólida Ltda</strong> contrata o fornecimento de 2000 sacos de Cimento Campeão Votoran com a <strong>Distribuidora São Paulo Matcon</strong>.</p>
        <p><strong>Valor: R$ 85.400,00</strong>. Entrega de 10 lotes de 200 sacos sob demanda técnica.</p>
        <p>Status: Aguardando assinatura do fornecedor no canal Whatsapp.</p>
      </div>
      `,
    },
    {
      id: CTR_4_ID,
      title: 'Aditivo 01 - Sede Corporativa ACME',
      related_party: 'ACME Real Estate S/A',
      type: 'OBRA' as const,
      value: new Prisma.Decimal('32000.00'),
      start_date: new Date('2026-05-01'),
      end_date: new Date('2026-06-25'),
      status: 'ACTIVE' as const,
      field_values: {},
      html_content: '<p>Termo de Aditivo de readequação de layout do 3º pavimento e acréscimo de climatização temporária.</p>',
    },
    {
      id: CTR_5_ID,
      title: 'Pintura Fachada Residencial Bela Vista',
      related_party: 'Pintores Associados ABC Ltda',
      type: 'SERVICO' as const,
      value: new Prisma.Decimal('58000.00'),
      start_date: new Date('2026-05-20'),
      end_date: new Date('2026-09-30'),
      status: 'DRAFT' as const,
      field_values: {},
      html_content: '<p>Rascunho do escopo para aplicação de impermeabilização e pintura geral na fachada do Bloco C do Residencial Bela Vista.</p>',
    },
  ];

  for (const c of contractsData) {
    await prisma.contract.create({
      data: {
        ...c,
        company_id: company.id,
        created_by: admin.id,
      },
    });
  }
  console.log('✅ Contratos criados');

  // ─── Signatures ────────────────────────────────────────────────────────────
  await prisma.signatureRequest.create({
    data: {
      id: 'sig-1111-1111-1111-111111111111',
      contract_id: CTR_3_ID,
      channel: 'WHATSAPP',
      status: 'PENDING',
      recipient_name: 'Geraldo Alckmin (Dir. Comercial)',
      recipient_email: 'geraldo.matcon@gmail.com',
      recipient_phone: '11987654321',
      token: 'token-cimento-9988',
      expires_at: new Date('2026-06-15T14:15:00Z'),
      sent_at: new Date('2026-05-15T14:15:00Z'),
      viewed_at: new Date('2026-05-16T10:30:00Z'),
    },
  });

  await prisma.signatureRequest.create({
    data: {
      id: 'sig-2222-2222-2222-222222222222',
      contract_id: CTR_5_ID,
      channel: 'EMAIL',
      status: 'PENDING',
      recipient_name: 'Manoel da Silva (Pintores ABC)',
      recipient_email: 'manoel@pintoresabc.com.br',
      recipient_phone: '11977661212',
      token: 'token-pintura-5544',
      expires_at: new Date('2026-06-20T10:30:00Z'),
      sent_at: new Date('2026-05-20T10:30:00Z'),
    },
  });
  console.log('✅ Assinaturas criadas');

  // ─── Obras ────────────────────────────────────────────────────────────────
  // Limpar obras e sub-dados
  await prisma.obraCusto.deleteMany({ where: { obra: { company_id: company.id } } });
  await prisma.obraVistoria.deleteMany({ where: { obra: { company_id: company.id } } });
  await prisma.obraStep.deleteMany({ where: { obra: { company_id: company.id } } });
  await prisma.purchaseOrder.deleteMany({ where: { company_id: company.id } });
  await prisma.obra.deleteMany({ where: { company_id: company.id } });

  const obra1 = await prisma.obra.create({
    data: {
      id: OBR_1_ID,
      company_id: company.id,
      contract_id: CTR_1_ID,
      created_by: admin.id,
      name: 'Residencial Bela Vista (Bloco C)',
      status: 'IN_PROGRESS',
      budget: new Prisma.Decimal('500000.00'),
      actual_cost: new Prisma.Decimal('410000.00'),
      start_date: new Date('2026-01-10'),
      end_date: new Date('2026-08-30'),
      completion_pct: 75,
      responsible: 'Engº Marcos Rezende',
    },
  });

  const obra2 = await prisma.obra.create({
    data: {
      id: OBR_2_ID,
      company_id: company.id,
      contract_id: CTR_2_ID,
      created_by: admin.id,
      name: 'Sede Corporativa ACME (Retrofit)',
      status: 'IN_PROGRESS',
      budget: new Prisma.Decimal('850000.00'),
      actual_cost: new Prisma.Decimal('390000.00'),
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-11-15'),
      completion_pct: 40,
      responsible: 'Eng. Arthur Mendes',
    },
  });

  const obra3 = await prisma.obra.create({
    data: {
      id: OBR_3_ID,
      company_id: company.id,
      created_by: admin.id,
      name: 'Condomínio Villas del Sol',
      status: 'PLANNING',
      budget: new Prisma.Decimal('2500000.00'),
      actual_cost: new Prisma.Decimal('120000.00'),
      start_date: new Date('2026-05-08'),
      end_date: new Date('2027-05-30'),
      completion_pct: 5,
      responsible: 'Engª Mariana Costa',
    },
  });
  console.log('✅ Obras criadas');

  // Seeding Steps
  await prisma.obraStep.createMany({
    data: [
      // Obra 1
      { obra_id: OBR_1_ID, title: 'Sondagem SPT concluída', phase: 'FUNDACAO', status: 'COMPLETED', order: 1, due_date: new Date('2026-01-20'), notes: 'Sondagem OK' },
      { obra_id: OBR_1_ID, title: 'Estaqueamento de concreto', phase: 'FUNDACAO', status: 'COMPLETED', order: 2, due_date: new Date('2026-02-15'), notes: 'Concluído no prazo' },
      { obra_id: OBR_1_ID, title: 'Lajes do 1º ao 4º Pavimento', phase: 'ALVENARIA', status: 'COMPLETED', order: 3, due_date: new Date('2026-04-10'), notes: 'Cura rápida operada' },
      { obra_id: OBR_1_ID, title: 'Laje Técnica de Cobertura', phase: 'ALVENARIA', status: 'PENDING', order: 4, due_date: new Date('2026-06-30'), notes: 'Aguardando guindaste' },
      { obra_id: OBR_1_ID, title: 'Pintura e fachada', phase: 'ACABAMENTO', status: 'PENDING', order: 5, due_date: new Date('2026-08-15'), notes: 'Contrato ctr-5 em rascunho vinculado a esta fase.' },
      // Obra 2
      { obra_id: OBR_2_ID, title: 'Remoção de paredes internas antigas', phase: 'PLANEJAMENTO', status: 'COMPLETED', order: 1, due_date: new Date('2026-03-20') },
      { obra_id: OBR_2_ID, title: 'Descarte de resíduos e caçambas', phase: 'PLANEJAMENTO', status: 'COMPLETED', order: 2, due_date: new Date('2026-04-05') },
      { obra_id: OBR_2_ID, title: 'Rede Elétrica Secundária trifásica', phase: 'INSTALACOES', status: 'PENDING', order: 3, due_date: new Date('2026-07-20') },
      { obra_id: OBR_2_ID, title: 'Instalação de chillers centrais VRF', phase: 'ACABAMENTO', status: 'PENDING', order: 4, due_date: new Date('2026-10-10') },
      // Obra 3
      { obra_id: OBR_3_ID, title: 'Liberação de alvará de construção', phase: 'PLANEJAMENTO', status: 'COMPLETED', order: 1, due_date: new Date('2026-05-10'), notes: 'Alvará expedido pela prefeitura.' },
      { obra_id: OBR_3_ID, title: 'Estudo de impacto ambiental FATMA', phase: 'PLANEJAMENTO', status: 'PENDING', order: 2, due_date: new Date('2026-06-30') },
      { obra_id: OBR_3_ID, title: 'Terraplanagem e cercamento', phase: 'PRE_OBRA', status: 'PENDING', order: 3, due_date: new Date('2026-08-30') },
    ],
  });

  // Seeding Custos
  await prisma.obraCusto.createMany({
    data: [
      // Obra 1
      { obra_id: OBR_1_ID, date: new Date('2026-01-15'), description: 'Nota Fiscal Sondagem Geotécnica', category: 'MATERIAL', value: new Prisma.Decimal('35000.00'), payment_status: 'PAID' },
      { obra_id: OBR_1_ID, date: new Date('2026-02-10'), description: 'Aquisição de vergalhões de aço Gerdau', category: 'MATERIAL', value: new Prisma.Decimal('180000.00'), payment_status: 'PAID' },
      { obra_id: OBR_1_ID, date: new Date('2026-03-05'), description: 'Lançamento de Concreto Usinado', category: 'MATERIAL', value: new Prisma.Decimal('120000.00'), payment_status: 'PAID' },
      { obra_id: OBR_1_ID, date: new Date('2026-04-20'), description: 'Aluguel de Betoneiras e Andaimes', category: 'EQUIPAMENTO', value: new Prisma.Decimal('75000.00'), payment_status: 'PAID' },
      // Obra 2
      { obra_id: OBR_2_ID, date: new Date('2026-03-15'), description: 'Pagamento de Caçambas e Demolição Civil', category: 'OUTROS', value: new Prisma.Decimal('140000.00'), payment_status: 'PAID' },
      { obra_id: OBR_2_ID, date: new Date('2026-04-10'), description: 'Primeira Parcela Climatização Aditiva', category: 'SERVICO_TERCEIRO', value: new Prisma.Decimal('150000.00'), payment_status: 'PAID' },
      { obra_id: OBR_2_ID, date: new Date('2026-05-02'), description: 'Locação Escavadeira CAT Terceira Franquia', category: 'EQUIPAMENTO', value: new Prisma.Decimal('100000.00'), payment_status: 'PAID' },
      // Obra 3
      { obra_id: OBR_3_ID, date: new Date('2026-05-08'), description: 'Taxas Prefeitura Alvarás e Licenças', category: 'LICENCA_TAXA', value: new Prisma.Decimal('120000.00'), payment_status: 'PAID' },
    ],
  });

  // Seeding Vistorias
  await prisma.obraVistoria.create({
    data: {
      id: 'vis-1111-1111-1111-111111111111',
      obra_id: OBR_1_ID,
      date: new Date('2026-02-20'),
      type: 'INICIAL',
      inspector: 'Eng. Reinaldo Santos',
      description: 'Vistoria técnica de liberação das fundações profundas para arranque dos pilares principais.',
      conditions: {},
    },
  });

  await prisma.obraVistoria.create({
    data: {
      id: 'vis-2222-2222-2222-222222222222',
      obra_id: OBR_1_ID,
      date: new Date('2026-04-15'),
      type: 'PARCIAL',
      inspector: 'Eng. Marcos Rezende',
      description: 'Concorrência de verticalidade e prumo da estrutura de concreto armado. Tolerâncias em conformidade.',
      conditions: {},
    },
  });

  console.log('✅ Etapas, Custos e Vistorias das Obras criados');

  // ─── Purchase Orders ───────────────────────────────────────────────────────
  await prisma.purchaseOrder.create({
    data: {
      id: PO_1_ID,
      company_id: company.id,
      obra_id: OBR_1_ID,
      number: 'po-1',
      title: 'Residencial Bela Vista (Bloco C)',
      supplier: 'Gerdau Aços Brasil S/A',
      supplier_cnpj: '01203405000188',
      payer_cnpj: '12345678000190',
      status: 'APPROVED',
      items: [
        { id: 'poi-1', description: 'Vergalhão de Aço CA-50 10mm', quantity: 500, unit: 'barra', unit_price: 85, total: 42500 },
        { id: 'poi-2', description: 'Vergalhão de Aço CA-50 12.5mm', quantity: 300, unit: 'barra', unit_price: 110, total: 33000 },
        { id: 'poi-3', description: 'Arame Recozido Gerdau BWG 18', quantity: 200, unit: 'roll', unit_price: 45, total: 9000 },
      ],
      subtotal: new Prisma.Decimal('84500.00'),
      taxes: new Prisma.Decimal('4225.00'),
      discount: new Prisma.Decimal('2500.00'),
      total: new Prisma.Decimal('86225.00'),
      delivery_date: new Date('2026-06-10'),
      notes: 'Entrega imediata programada para canteiro central sob responsabilidade da obra.',
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      id: PO_2_ID,
      company_id: company.id,
      obra_id: OBR_2_ID,
      number: 'po-2',
      title: 'Sede Corporativa ACME (Retrofit)',
      supplier: 'Ar Condicionado Continental S/A',
      supplier_cnpj: '05678910000133',
      payer_cnpj: '12345678000190',
      status: 'PENDING_APPROVAL',
      items: [
        { id: 'poi-4', description: 'Evaporadora Split Inverter 12.000 BTU/h', quantity: 8, unit: 'unidade', unit_price: 2200, total: 17600 },
        { id: 'poi-5', description: 'Condensadora Central Multi-Split VRF 8HP', quantity: 2, unit: 'unidade', unit_price: 18500, total: 37000 },
      ],
      subtotal: new Prisma.Decimal('54600.00'),
      taxes: new Prisma.Decimal('2730.00'),
      discount: new Prisma.Decimal('1000.00'),
      total: new Prisma.Decimal('56330.00'),
      delivery_date: new Date('2026-07-25'),
      notes: 'Aguardando conferência do eng. de climatização antes de liberar faturamento.',
    },
  });
  console.log('✅ Ordens de Compra criadas');

  // ─── Audit Logs ──────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      company_id: company.id,
      user_id: admin.id,
      entity_type: 'Company',
      entity_id: company.id,
      action: 'CREATE',
      new_value: { name: company.name },
    },
  });

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('📋 Credenciais de acesso:');
  console.log('   Email: admin@solida.com.br           / Senha: senha123! (Admin)');
  console.log('   Email: marcos@solida.com.br          / Senha: senha123! (Manager)');
  console.log('   Email: mariana.costa@solida.com.br   / Senha: senha123! (Operator)');
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
