import { FieldType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateFieldInput,
  UpdateFieldInput,
} from './templates.schemas';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { Request } from 'express';

/** Default templates to seed per company */
const DEFAULT_TEMPLATES = [
  {
    name: 'Contrato Básico de Serviço',
    type: 'SERVICO' as const,
    description: 'Template ágil e direto para prestação de serviços',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS
  </h2>
  
  <p>Pelo presente instrumento particular, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede estabelecida no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>CONTRATADO:</strong> <strong>{{parte_relacionada}}</strong>, doravante denominado simplesmente Prestador de Serviços.
  </p>
  
  <p>As partes acima qualificadas resolvem, de comum acordo, celebrar o presente contrato mediante as seguintes cláusulas e condições:</p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DO OBJETO
  </h3>
  <p>
    O presente instrumento tem por objeto a prestação de serviços profissionais consistentes em: <strong>{{objeto_detalhado}}</strong>. 
    Os serviços deverão observar o seguinte cronograma e prazo de entrega: <strong>{{prazo_entrega}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DOS VALORES E CONDIÇÕES DE PAGAMENTO
  </h3>
  <p>
    Pelos serviços efetivamente prestados, a CONTRATANTE pagará ao CONTRATADO o valor total de <strong>R$ {{valor_total}}</strong>, 
    cujo adimplemento dar-se-á na seguinte modalidade: <strong>{{forma_pagamento}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DA VIGÊNCIA E RESCISÃO
  </h3>
  <p>
    O presente contrato entra em vigor na data de <strong>{{data_inicio}}</strong> e terá vigência determinada até <strong>{{data_fim}}</strong>. 
    Em caso de rescisão imotivada por qualquer das partes antes do prazo acordado, aplicar-se-á a multa rescisória de <strong>{{multa_rescisao}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DA GESTÃO E FISCALIZAÇÃO
  </h3>
  <p>
    A execução deste contrato será acompanhada e fiscalizada diretamente pelo gestor designado pela CONTRATANTE, Sr(a). <strong>{{gestor_contrato}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUINTA – DO FORO ELEITO
  </h3>
  <p>
    Para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, as partes elegem foro da comarca de <strong>{{cidade_foro}}</strong>, com exclusão de qualquer outro.
  </p>
  
  <p style="margin-top:40px;">E, por estarem assim justas e contratadas, assinam o presente instrumento por meio de assinaturas eletrônicas integradas.</p>
  
  <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>CONTRATANTE</strong><br/>
        <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
      </div>
    </div>
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>CONTRATADO</strong><br/>
        <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
      </div>
    </div>
  </div>
</div>`,
    fields: [
      { label: 'Descrição Detalhada do Serviço', field_key: 'objeto_detalhado', field_type: 'TEXTAREA', required: true, order: 1 },
      { label: 'Prazo ou Cronograma de Entrega (Ex: 30 dias)', field_key: 'prazo_entrega', field_type: 'TEXT', required: true, order: 2 },
      { label: 'Forma de Pagamento (Ex: Transferência bancária)', field_key: 'forma_pagamento', field_type: 'TEXT', required: true, order: 3 },
      { label: 'Multa Rescisória (Ex: 10% do valor restante)', field_key: 'multa_rescisao', field_type: 'TEXT', required: true, order: 4 },
      { label: 'Gestor do Contrato na CONTRATANTE', field_key: 'gestor_contrato', field_type: 'TEXT', required: true, order: 5 },
      { label: 'Cidade do Foro Competente', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 6 },
    ],
  },
  {
    name: 'Contrato Básico de Trabalho',
    type: 'TRABALHO' as const,
    description: 'Template simplificado para admissão',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    CONTRATO INDIVIDUAL DE TRABALHO
  </h2>
  
  <p>Pelo presente instrumento, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>EMPREGADORA:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede estabelecida no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>EMPREGADO:</strong> <strong>{{parte_relacionada}}</strong>, de nacionalidade <strong>{{nacionalidade_empregado}}</strong>, estado civil <strong>{{estado_civil_empregado}}</strong>, portador do CPF sob o nº <strong>{{cpf_empregado}}</strong>.
  </p>
  
  <p>As partes acima qualificadas celebram o presente Contrato Individual de Trabalho, que se regerá pelas cláusulas seguintes e pela CLT:</p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DA FUNÇÃO
  </h3>
  <p>
    O Empregado é contratado para exercer a função de <strong>{{cargo_funcao}}</strong>, bem como todas as tarefas correlatas e inerentes ao cargo, de acordo com as instruções da Diretoria.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DA JORNADA DE TRABALHO
  </h3>
  <p>
    A jornada de trabalho acordada será de <strong>{{jornada_trabalho}}</strong>, respeitados os limites legais e constitucionais de duração do trabalho.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DA REMUNERAÇÃO
  </h3>
  <p>
    Como contraprestação pelos serviços prestados, a Empregadora pagará ao Empregado o salário base mensal correspondente a <strong>R$ {{valor_total}}</strong>, 
    sujeito aos descontos previstos em lei.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DO PRAZO E INÍCIO
  </h3>
  <p>
    O presente contrato de trabalho terá início de vigência na data de <strong>{{data_inicio}}</strong> e é firmado por prazo indeterminado, com período de experiência conforme regulamentação interna.
  </p>
  
  <p style="margin-top:40px; text-align:right;">
    <strong>{{cidade_assinatura}}</strong>, em {{data_inicio}}.
  </p>
  
  <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>EMPREGADORA</strong><br/>
        <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
      </div>
    </div>
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>EMPREGADO</strong><br/>
        <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
      </div>
    </div>
  </div>
</div>`,
    fields: [
      { label: 'CPF do Empregado', field_key: 'cpf_empregado', field_type: 'TEXT', required: true, order: 1 },
      { label: 'Nacionalidade do Empregado', field_key: 'nacionalidade_empregado', field_type: 'TEXT', required: true, order: 2 },
      { label: 'Estado Civil do Empregado', field_key: 'estado_civil_empregado', field_type: 'TEXT', required: true, order: 3 },
      { label: 'Cargo ou Função (Ex: Analista)', field_key: 'cargo_funcao', field_type: 'TEXT', required: true, order: 4 },
      { label: 'Jornada de Trabalho (Ex: Segunda a Sexta das 9h às 18h)', field_key: 'jornada_trabalho', field_type: 'TEXT', required: true, order: 5 },
      { label: 'Cidade de Assinatura do Contrato', field_key: 'cidade_assinatura', field_type: 'TEXT', required: true, order: 6 },
    ],
  },
  {
    name: 'Contrato Básico de Obra',
    type: 'OBRA' as const,
    description: 'Contrato objetivo para execução de obra civil',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    CONTRATO DE EMPREITADA DE OBRA CIVIL
  </h2>
  
  <p>Pelo presente instrumento, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede estabelecida no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>CONTRATADA / EMPREITEIRA:</strong> <strong>{{parte_relacionada}}</strong>, representada neste ato por <strong>{{representante_contratada}}</strong>, inscrita no CNPJ/CPF sob o nº <strong>{{cpf_cnpj_contratada}}</strong>.
  </p>
  
  <p>As partes acima acordam em firmar o presente contrato de prestação de serviços por empreitada civil mediante as seguintes cláusulas:</p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DO OBJETO E LOCAL DA OBRA
  </h3>
  <p>
    O objeto do presente contrato consiste na execução, pela CONTRATADA, de: <strong>{{descricao_servicos}}</strong>.
    Toda a execução física e técnica da obra dar-se-á no imóvel localizado no endereço: <strong>{{endereco_obra}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DOS VALORES E CRONOGRAMA FINANCEIRO
  </h3>
  <p>
    Pela execução integral da obra, a CONTRATANTE pagará à CONTRATADA o valor global e fixo de <strong>R$ {{valor_total}}</strong>, 
    a ser liberado em parcelas de acordo com a evolução física e medição dos serviços descritos nos anexos deste contrato.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DOS PRAZOS E RESPONSABILIDADE TÉCNICA
  </h3>
  <p>
    As obras terão início oficial em <strong>{{data_inicio}}</strong>, com estimativa de entrega definitiva e recepção das chaves em <strong>{{data_fim}}</strong>. 
    Em caso de atraso injustificado na entrega, aplicar-se-á a multa diária de <strong>{{multa_atraso}}</strong>.
  </p>
  <p>
    A responsabilidade técnica civil perante os órgãos reguladores e prefeituras competentes fica a cargo do Sr(a). <strong>{{responsavel_tecnico}}</strong>.
  </p>
  
  <p style="margin-top:40px;">E, por estarem assim de comum acordo, assinam digitalmente o presente instrumento para que produza os efeitos jurídicos necessários.</p>
  
  <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>CONTRATANTE</strong><br/>
        <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
      </div>
    </div>
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>CONTRATADA</strong><br/>
        <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
      </div>
    </div>
  </div>
</div>`,
    fields: [
      { label: 'Nome do Representante da CONTRATADA', field_key: 'representante_contratada', field_type: 'TEXT', required: true, order: 1 },
      { label: 'CNPJ/CPF da CONTRATADA', field_key: 'cpf_cnpj_contratada', field_type: 'TEXT', required: true, order: 2 },
      { label: 'Descrição dos Serviços da Obra', field_key: 'descricao_servicos', field_type: 'TEXTAREA', required: true, order: 3 },
      { label: 'Endereço da Obra', field_key: 'endereco_obra', field_type: 'TEXTAREA', required: true, order: 4 },
      { label: 'Responsável Técnico (Nome e CREA/CAU)', field_key: 'responsavel_tecnico', field_type: 'TEXT', required: true, order: 5 },
      { label: 'Multa Diária por Atraso (Ex: R$ 500,00)', field_key: 'multa_atraso', field_type: 'TEXT', required: true, order: 6 },
    ],
  },
  {
    name: 'Contrato Básico de Locação',
    type: 'LOCACAO' as const,
    description: 'Template de locação ágil e direto',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    CONTRATO DE LOCAÇÃO DE IMÓVEL URBANO
  </h2>
  
  <p>Pelo presente instrumento, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>LOCADOR:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede estabelecida no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>LOCATÁRIO:</strong> <strong>{{parte_relacionada}}</strong>, sob o estado civil de <strong>{{estado_civil_locatario}}</strong>, portador do CPF/CNPJ sob o nº <strong>{{cpf_cnpj_locatario}}</strong>.
  </p>
  
  <p>As partes acima qualificadas têm entre si justo e acertado o aluguel do imóvel urbano mediante as cláusulas e condições seguintes:</p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DO OBJETO E FINALIDADE
  </h3>
  <p>
    O presente contrato tem por objeto a locação do imóvel urbano situado no endereço: <strong>{{endereco_imovel}}</strong>.
    O imóvel locado destinar-se-á exclusivamente para fins de utilização <strong>{{finalidade_locacao}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DOS VALORES E REAJUSTES
  </h3>
  <p>
    O aluguel mensal inicial acordado entre as partes é de <strong>R$ {{valor_total}}</strong>, a ser pago até o dia 10 de cada mês subsequente ao vencido.
    Fica pactuado que o reajuste anual do valor do aluguel observará a variação acumulada do índice <strong>{{indice_reajuste}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DO PRAZO DA LOCAÇÃO
  </h3>
  <p>
    O prazo da locação é determinado, iniciando-se em <strong>{{data_inicio}}</strong> e com término de vigência previsto para a data de <strong>{{data_fim}}</strong>.
  </p>
  
  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DA GARANTIA LOCATÍCIA
  </h3>
  <p>
    Como garantia de adimplemento pontual e preservação do imóvel, o LOCATÁRIO apresenta como modalidade de garantia a seguinte caução/fiador: <strong>{{tipo_garantia}}</strong>.
  </p>
  
  <p style="margin-top:40px;">E por estarem justas e contratadas, as partes assinam eletronicamente o presente instrumento de locação.</p>
  
  <div style="margin-top:60px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>LOCADOR</strong><br/>
        <span style="font-size:12px; color:#666;">{{empresa_contratante}}</span>
      </div>
    </div>
    <div>
      <div style="border-top:1px solid #1a1a1a; padding-top:5px; margin-top:40px;">
        <strong>LOCATÁRIO</strong><br/>
        <span style="font-size:12px; color:#666;">{{parte_relacionada}}</span>
      </div>
    </div>
  </div>
</div>`,
    fields: [
      { label: 'CPF/CNPJ do Locatário', field_key: 'cpf_cnpj_locatario', field_type: 'TEXT', required: true, order: 1 },
      { label: 'Estado Civil do Locatário', field_key: 'estado_civil_locatario', field_type: 'TEXT', required: true, order: 2 },
      { label: 'Endereço Completo do Imóvel', field_key: 'endereco_imovel', field_type: 'TEXTAREA', required: true, order: 3 },
      { label: 'Finalidade da Locação (Ex: Residencial)', field_key: 'finalidade_locacao', field_type: 'TEXT', required: true, order: 4 },
      { label: 'Índice de Reajuste Anual (Ex: IPCA)', field_key: 'indice_reajuste', field_type: 'TEXT', required: true, order: 5 },
      { label: 'Tipo de Garantia (Ex: Caução de 3 meses)', field_key: 'tipo_garantia', field_type: 'TEXT', required: true, order: 6 },
    ],
  },
  {
    name: 'Prestação de Serviço Profissional',
    type: 'SERVICO' as const,
    description: 'Contrato completo para prestação de serviços profissionais especializados, com cláusulas de objeto, pagamento, vigência, confidencialidade e foro.',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS
  </h2>

  <p>Pelo presente instrumento particular, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>CONTRATADO(A):</strong> <strong>{{parte_relacionada}}</strong>, prestador(a) de serviços, CPF/CNPJ nº <strong>{{cpf_cnpj_prestador}}</strong>, especializado(a) na área de <strong>{{area_especialidade}}</strong>.
  </p>

  <p>As partes acima qualificadas resolvem, de comum acordo, celebrar o presente contrato mediante as cláusulas e condições seguintes:</p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DO OBJETO
  </h3>
  <p>
    O presente instrumento tem por objeto a prestação de serviços profissionais especializados consistentes em: <strong>{{objeto_servico}}</strong>.
    Os serviços serão executados conforme proposta técnica e cronograma definidos em Anexo I deste contrato.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DO PRAZO E LOCAL DE EXECUÇÃO
  </h3>
  <p>
    A execução dos serviços terá início na data de <strong>{{data_inicio}}</strong> e deverá ser concluída até <strong>{{data_fim}}</strong>,
    podendo ser prorrogada mediante aditivo escrito. Os serviços serão executados primordialmente no local: <strong>{{local_execucao}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DOS VALORES E CONDIÇÕES DE PAGAMENTO
  </h3>
  <p>
    Pela prestação dos serviços ora contratados, a CONTRATANTE pagará ao CONTRATADO o valor total de <strong>R$ {{valor_total}}</strong>,
    dividido em <strong>{{numero_parcelas}}</strong> parcelas mensais iguais, conforme a forma de pagamento: <strong>{{forma_pagamento}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DAS OBRIGAÇÕES DO CONTRATADO
  </h3>
  <p>
    O CONTRATADO obriga-se a: (i) executar os serviços com toda a diligência, qualidade e técnica requeridas; (ii) manter sigilo sobre todas as
    informações obtidas em razão deste contrato; (iii) responsabilizar-se por todos os encargos trabalhistas, previdenciários e fiscais.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUINTA – DA RESCISÃO E PENALIDADES
  </h3>
  <p>
    O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.
    Em caso de rescisão imotivada, a parte infratora pagará multa compensatória de <strong>{{multa_rescisao}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEXTA – DO FORO ELEITO
  </h3>
  <p>
    Fica eleito o Foro da Comarca de <strong>{{cidade_foro}}</strong> para dirimir quaisquer dúvidas decorrentes deste contrato.
  </p>

  <p style="margin-top:40px;">E, por estarem de pleno acordo, firmam o presente instrumento por meio de assinatura eletrônica certificada.</p>

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
</div>`,
    fields: [
      { label: 'CPF/CNPJ do Prestador', field_key: 'cpf_cnpj_prestador', field_type: 'TEXT', required: true, order: 1 },
      { label: 'Área de Especialidade (Ex: Engenharia Civil)', field_key: 'area_especialidade', field_type: 'TEXT', required: true, order: 2 },
      { label: 'Descrição Detalhada do Serviço', field_key: 'objeto_servico', field_type: 'TEXTAREA', required: true, order: 3 },
      { label: 'Local de Execução dos Serviços', field_key: 'local_execucao', field_type: 'TEXT', required: true, order: 4 },
      { label: 'Número de Parcelas', field_key: 'numero_parcelas', field_type: 'NUMBER', required: true, order: 5 },
      { label: 'Forma de Pagamento', field_key: 'forma_pagamento', field_type: 'TEXT', required: true, order: 6 },
      { label: 'Multa Rescisória (Ex: 10% do valor restante)', field_key: 'multa_rescisao', field_type: 'TEXT', required: true, order: 7 },
      { label: 'Cidade do Foro Competente', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 8 },
    ],
  },
  {
    name: 'Contrato de Trabalho Completo',
    type: 'TRABALHO' as const,
    description: 'Contrato individual de trabalho completo com cláusulas de função, jornada, remuneração, benefícios, período de experiência e encargos legais (CLT).',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO INDETERMINADO
  </h2>

  <p>Pelo presente instrumento, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>EMPREGADORA:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>EMPREGADO(A):</strong> <strong>{{parte_relacionada}}</strong>, nacionalidade <strong>{{nacionalidade_empregado}}</strong>, estado civil <strong>{{estado_civil_empregado}}</strong>,
    portador(a) do CPF nº <strong>{{cpf_empregado}}</strong>, RG nº <strong>{{rg_empregado}}</strong>, residente à <strong>{{endereco_empregado}}</strong>.
  </p>

  <p>As partes celebram o presente Contrato Individual de Trabalho, que se regerá pela CLT e pelas cláusulas seguintes:</p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DA ADMISSÃO E FUNÇÃO
  </h3>
  <p>
    O(A) EMPREGADO(A) é admitido(a) a partir de <strong>{{data_inicio}}</strong> para exercer a função de <strong>{{cargo_funcao}}</strong>,
    no departamento de <strong>{{departamento}}</strong>, realizando todas as tarefas inerentes ao cargo, conforme instruções da empresa.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DO PERÍODO DE EXPERIÊNCIA
  </h3>
  <p>
    Nos primeiros <strong>{{periodo_experiencia}}</strong> dias, o(a) EMPREGADO(A) estará sujeito(a) ao período de experiência conforme art. 443, § 1º da CLT.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DA JORNADA DE TRABALHO
  </h3>
  <p>
    A jornada de trabalho acordada será de <strong>{{jornada_trabalho}}</strong>, respeitados os limites legais de duração do trabalho.
    As horas extraordinárias, quando autorizadas, serão remuneradas conforme a legislação vigente.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DA REMUNERAÇÃO E BENEFÍCIOS
  </h3>
  <p>
    A EMPREGADORA pagará ao(à) EMPREGADO(A) o salário base mensal de <strong>R$ {{valor_total}}</strong>, sujeito aos descontos previstos em lei (INSS, IRRF).
    Adicionalmente, fará jus aos benefícios de: <strong>{{beneficios_concedidos}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUINTA – DO LOCAL DE TRABALHO
  </h3>
  <p>
    Os serviços serão prestados no estabelecimento localizado em: <strong>{{local_trabalho}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEXTA – DAS DISPOSIÇÕES GERAIS E FORO
  </h3>
  <p>
    O(A) EMPREGADO(A) declara estar ciente das políticas internas da empresa. As partes elegem a Vara do Trabalho da Comarca de <strong>{{cidade_foro}}</strong>
    para dirimir quaisquer litígios decorrentes deste contrato.
  </p>

  <p style="margin-top:40px; text-align:right;"><strong>{{cidade_foro}}</strong>, em {{data_inicio}}.</p>

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
</div>`,
    fields: [
      { label: 'CPF do Empregado(a)', field_key: 'cpf_empregado', field_type: 'TEXT', required: true, order: 1 },
      { label: 'RG do Empregado(a)', field_key: 'rg_empregado', field_type: 'TEXT', required: true, order: 2 },
      { label: 'Nacionalidade', field_key: 'nacionalidade_empregado', field_type: 'TEXT', required: true, order: 3 },
      { label: 'Estado Civil', field_key: 'estado_civil_empregado', field_type: 'TEXT', required: true, order: 4 },
      { label: 'Endereço Residencial do Empregado', field_key: 'endereco_empregado', field_type: 'TEXTAREA', required: true, order: 5 },
      { label: 'Cargo / Função', field_key: 'cargo_funcao', field_type: 'TEXT', required: true, order: 6 },
      { label: 'Departamento', field_key: 'departamento', field_type: 'TEXT', required: false, order: 7 },
      { label: 'Período de Experiência (Ex: 45 dias)', field_key: 'periodo_experiencia', field_type: 'TEXT', required: true, order: 8 },
      { label: 'Jornada de Trabalho (Ex: 44h semanais, Segunda a Sexta 8h-17h)', field_key: 'jornada_trabalho', field_type: 'TEXT', required: true, order: 9 },
      { label: 'Benefícios Concedidos (Ex: Vale-refeição, plano de saúde)', field_key: 'beneficios_concedidos', field_type: 'TEXT', required: false, order: 10 },
      { label: 'Local de Trabalho (endereço do estabelecimento)', field_key: 'local_trabalho', field_type: 'TEXT', required: true, order: 11 },
      { label: 'Cidade do Foro Trabalhista', field_key: 'cidade_foro', field_type: 'TEXT', required: true, order: 12 },
    ],
  },
  {
    name: 'Contrato de Execução de Obra Civil',
    type: 'OBRA' as const,
    description: 'Contrato de empreitada completo para execução de obra civil, com definição de escopo, cronograma, responsabilidade técnica, medições e penalidades por atraso.',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    CONTRATO DE EMPREITADA GLOBAL DE OBRA CIVIL
  </h2>

  <p>Pelo presente instrumento particular, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>CONTRATANTE:</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº {{cnpj_contratante}}, com sede no endereço cadastrado no sistema; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>CONTRATADA / EMPREITEIRA:</strong> <strong>{{parte_relacionada}}</strong>, inscrita no CNPJ/CPF nº <strong>{{cpf_cnpj_contratada}}</strong>,
    com sede em <strong>{{endereco_contratada}}</strong>, representada por Sr(a). <strong>{{representante_contratada}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DO OBJETO E ESCOPO DA OBRA
  </h3>
  <p>
    O objeto do presente contrato consiste na execução, pela CONTRATADA, dos seguintes serviços e obras: <strong>{{descricao_obra}}</strong>.
    A obra será executada no imóvel situado no endereço: <strong>{{endereco_obra}}</strong>.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DOS PRAZOS DE EXECUÇÃO
  </h3>
  <p>
    As obras terão início oficial em <strong>{{data_inicio}}</strong> e a entrega definitiva está prevista para <strong>{{data_fim}}</strong>.
    Em caso de atraso injustificado, aplicar-se-á multa diária de <strong>{{multa_atraso_diaria}}</strong>, limitada a <strong>{{teto_multa}}</strong> do valor total.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DO VALOR E CONDIÇÕES DE PAGAMENTO
  </h3>
  <p>
    Pela execução integral das obras, a CONTRATANTE pagará à CONTRATADA o valor global e fixo de <strong>R$ {{valor_total}}</strong>.
    Os pagamentos serão liberados mediante aprovação das medições mensais conforme avanço físico verificado em campo.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DA RESPONSABILIDADE TÉCNICA
  </h3>
  <p>
    A responsabilidade técnica fica a cargo do(a) Sr(a). <strong>{{responsavel_tecnico}}</strong>,
    registrado(a) no CREA/CAU sob o nº <strong>{{registro_crea_cau}}</strong>. A CONTRATADA deverá providenciar a ART/RRT antes do início dos serviços.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUINTA – DOS MATERIAIS E MÃO DE OBRA
  </h3>
  <p>
    Todos os materiais, equipamentos e mão de obra necessários à execução da obra correrão por conta exclusiva da CONTRATADA,
    que se responsabiliza pela qualidade e conformidade técnica com as normas ABNT aplicáveis.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEXTA – DO FORO ELEITO
  </h3>
  <p>
    Fica eleito o Foro da Comarca de <strong>{{cidade_foro}}</strong>, com expressa renúncia a qualquer outro, por mais privilegiado que seja.
  </p>

  <p style="margin-top:40px;">E, por estarem assim de comum acordo, assinam digitalmente o presente instrumento.</p>

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
</div>`,
    fields: [
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
  {
    name: 'Contrato de Locação de Imóvel Completo',
    type: 'LOCACAO' as const,
    description: 'Contrato de locação de imóvel urbano completo com cláusulas de objeto, finalidade, valor, reajuste, garantia locatícia e obrigações das partes (Lei 8.245/1991).',
    html_content: `
<div style="font-family:'Times New Roman', Times, serif; color:#1a1a1a; line-height:1.8; max-width:780px; margin:0 auto; padding:40px 50px; text-align:justify;">
  <h2 style="text-align:center; font-size:18px; border-bottom:2px solid #1a1a1a; padding-bottom:10px; margin-bottom:30px; letter-spacing:1px; text-transform:uppercase;">
    CONTRATO DE LOCAÇÃO DE IMÓVEL URBANO
  </h2>

  <p>Pelo presente instrumento particular, de um lado:</p>
  <p style="margin-left:30px;">
    <strong>LOCADOR(A):</strong> <strong>{{empresa_contratante}}</strong>, inscrita no CNPJ sob o nº {{cnpj_contratante}}, doravante denominada simplesmente LOCADORA; e, de outro lado,
  </p>
  <p style="margin-left:30px;">
    <strong>LOCATÁRIO(A):</strong> <strong>{{parte_relacionada}}</strong>, estado civil <strong>{{estado_civil_locatario}}</strong>,
    portador(a) do CPF/CNPJ nº <strong>{{cpf_cnpj_locatario}}</strong>, residente ou com sede em <strong>{{endereco_locatario}}</strong>.
  </p>

  <p>As partes têm entre si justo e acordado o presente Contrato de Locação de Imóvel Urbano, regido pela Lei nº 8.245/1991 (Lei do Inquilinato) e pelas cláusulas seguintes:</p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA PRIMEIRA – DO OBJETO E FINALIDADE
  </h3>
  <p>
    O objeto do presente contrato é a locação do imóvel situado no endereço: <strong>{{endereco_imovel}}</strong>, composto por <strong>{{descricao_imovel}}</strong>.
    O imóvel será destinado exclusivamente para fins <strong>{{finalidade_locacao}}</strong>, sendo vedada qualquer outra utilização sem autorização escrita do(a) LOCADOR(A).
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEGUNDA – DO PRAZO DA LOCAÇÃO
  </h3>
  <p>
    O prazo da locação é de <strong>{{prazo_locacao}}</strong>, com início em <strong>{{data_inicio}}</strong> e término em <strong>{{data_fim}}</strong>.
    Após o término, persistindo a posse do LOCATÁRIO com anuência do LOCADOR, a locação converter-se-á em prazo indeterminado.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA TERCEIRA – DO ALUGUEL E REAJUSTE
  </h3>
  <p>
    O aluguel mensal ajustado entre as partes é de <strong>R$ {{valor_total}}</strong>, a ser pago até o dia <strong>{{dia_vencimento}}</strong> de cada mês.
    O aluguel será reajustado anualmente pelo índice <strong>{{indice_reajuste}}</strong> acumulado no período.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUARTA – DA GARANTIA LOCATÍCIA
  </h3>
  <p>
    Como garantia do fiel cumprimento das obrigações deste contrato, o LOCATÁRIO presta a seguinte garantia: <strong>{{tipo_garantia}}</strong>,
    no valor equivalente a <strong>{{valor_garantia}}</strong>, que será restituída ao final da locação, deduzidos eventuais débitos não quitados.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA QUINTA – DAS OBRIGAÇÕES DO LOCATÁRIO
  </h3>
  <p>
    O LOCATÁRIO obriga-se a: (i) pagar pontualmente o aluguel e demais encargos; (ii) usar o imóvel para o fim estipulado; (iii) conservar o imóvel no estado recebido;
    (iv) pagar as contas de consumo (água, energia elétrica, gás, telefone) e condomínio; (v) não realizar obras ou modificações sem autorização prévia e escrita do LOCADOR.
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; margin-top:25px; border-bottom:1px solid #ddd; padding-bottom:5px;">
    CLÁUSULA SEXTA – DO FORO ELEITO
  </h3>
  <p>
    As partes elegem o Foro da Comarca de <strong>{{cidade_foro}}</strong> para dirimir quaisquer dúvidas ou litígios oriundos deste contrato.
  </p>

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
</div>`,
    fields: [
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
] as const;

type TemplateField = {
  label: string;
  field_key: string;
  field_type: FieldType;
  required: boolean;
  order: number;
  options?: string[];
  placeholder?: string;
};

export class TemplatesService {
  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;

    const where = {
      company_id: companyId,
      active: true,
      ...(type && { type: type as never }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.contractTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { 
          fields: { orderBy: { order: 'asc' } },
          _count: { select: { fields: true, contracts: true } } 
        },
      }),
      prisma.contractTemplate.count({ where }),
    ]);

    return { templates, meta: buildMeta(total, page, limit) };
  }

  async findById(id: string, companyId: string) {
    const template = await prisma.contractTemplate.findFirst({
      where: { id, company_id: companyId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw AppErrors.notFound('Template não encontrado');
    return template;
  }

  async create(companyId: string, data: CreateTemplateInput) {
    return prisma.contractTemplate.create({
      data: { ...data, company_id: companyId },
      include: { fields: true },
    });
  }

  async update(id: string, companyId: string, data: UpdateTemplateInput) {
    await this.findById(id, companyId);
    return prisma.contractTemplate.update({
      where: { id },
      data,
      include: { fields: true },
    });
  }

  async archive(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.contractTemplate.update({
      where: { id },
      data: { active: false },
    });
  }

  async addField(templateId: string, companyId: string, data: CreateFieldInput) {
    await this.findById(templateId, companyId);
    return prisma.contractTemplateField.create({
      data: { ...data, template_id: templateId, options: data.options ?? [] },
    });
  }

  async updateField(templateId: string, fieldId: string, companyId: string, data: UpdateFieldInput) {
    await this.findById(templateId, companyId);
    const field = await prisma.contractTemplateField.findFirst({
      where: { id: fieldId, template_id: templateId },
    });
    if (!field) throw AppErrors.notFound('Campo não encontrado');
    return prisma.contractTemplateField.update({ where: { id: fieldId }, data });
  }

  async deleteField(templateId: string, fieldId: string, companyId: string) {
    await this.findById(templateId, companyId);
    const field = await prisma.contractTemplateField.findFirst({
      where: { id: fieldId, template_id: templateId },
    });
    if (!field) throw AppErrors.notFound('Campo não encontrado');
    return prisma.contractTemplateField.delete({ where: { id: fieldId } });
  }

  /**
   * Seed default templates for the authenticated company.
   * Idempotent: skips templates that already exist by name.
   */
  async seedDefaults(companyId: string) {
    const created = [];

    for (const tmpl of DEFAULT_TEMPLATES) {
      const existing = await prisma.contractTemplate.findFirst({
        where: { company_id: companyId, name: tmpl.name },
      });
      if (existing) continue;

      const { fields, ...templateData } = tmpl;
      const created_tmpl = await prisma.contractTemplate.create({
        data: {
          ...templateData,
          company_id: companyId,
          fields: {
            create: (fields as unknown as TemplateField[]).map((f) => ({
              label: f.label,
              field_key: f.field_key,
              field_type: f.field_type,
              required: f.required,
              order: f.order,
              options: f.options ?? [],
              placeholder: f.placeholder,
            })),
          },
        },
        include: { fields: true },
      });
      created.push(created_tmpl);
    }

    return {
      created: created.length,
      skipped: DEFAULT_TEMPLATES.length - created.length,
      templates: created,
    };
  }
}
