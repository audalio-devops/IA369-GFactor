package com.ia369.factoring.service;

import com.ia369.factoring.model.*;
import com.ia369.factoring.repository.*;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class BorderoService {

    // Private inner record used to carry both input and computed result per item
    private record ItemResult(BorderoItemRequest item, PricingEngine.CalculationResult calc, Sacado sacado) {
    }

    private final PricingEngine pricingEngine;
    private final CedenteRepository cedenteRepository;
    private final SacadoRepository sacadoRepository;
    private final BorderoRepository borderoRepository;
    private final TituloRepository tituloRepository;
    private final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public BorderoService(PricingEngine pricingEngine,
            CedenteRepository cedenteRepository,
            SacadoRepository sacadoRepository,
            BorderoRepository borderoRepository,
            TituloRepository tituloRepository) {
        this.pricingEngine = pricingEngine;
        this.cedenteRepository = cedenteRepository;
        this.sacadoRepository = sacadoRepository;
        this.borderoRepository = borderoRepository;
        this.tituloRepository = tituloRepository;
    }

    @Transactional
    public byte[] generateBorderoPdf(List<BorderoItemRequest> items,
            String cnpjCedente,
            BigDecimal taxaMensal,
            BigDecimal advaloremPercent,
            BigDecimal tarifaBoleto,
            BigDecimal iofFixo,
            BigDecimal iofDiario,
            int floatBancario,
            List<TarifaCustomizada> tarifasCustomizadas) {

        // --- Resolve cedente by CNPJ (digits only) ---
        String cnpjDigits = cnpjCedente != null ? cnpjCedente.replaceAll("\\D", "") : "";
        System.out.println("[BORDERO] Buscando cedente com CNPJ: '" + cnpjDigits + "'");
        EmpresaCedente cedente = (!cnpjDigits.isBlank())
                ? cedenteRepository.findByCnpj(cnpjDigits).orElseGet(() -> {
                    System.out
                            .println("[BORDERO] Cedente não encontrado. Criando placeholder para CNPJ: " + cnpjDigits);
                    EmpresaCedente placeholder = new EmpresaCedente();
                    placeholder.setRazao_social("Desconhecido");
                    placeholder.setCnpj(cnpjDigits);
                    placeholder.setTaxaPadraoDesagio(java.math.BigDecimal.ZERO);
                    return cedenteRepository.save(placeholder);
                })
                : null;
        System.out.println("[BORDERO] Cedente resolvido: "
                + (cedente != null ? cedente.getRazao_social() : "NULL (CNPJ em branco)"));

        // --- Compute pricing results and resolve/create sacados ---
        List<ItemResult> results = new ArrayList<>();
        BigDecimal totalBruto = BigDecimal.ZERO;
        BigDecimal totalLiquido = BigDecimal.ZERO;
        BigDecimal totalDesagio = BigDecimal.ZERO;
        BigDecimal totalAdvalorem = BigDecimal.ZERO;
        BigDecimal totalTarifas = BigDecimal.ZERO;
        BigDecimal totalIof = BigDecimal.ZERO;

        for (BorderoItemRequest item : (items == null ? List.<BorderoItemRequest>of() : items)) {
            PricingEngine.CalculationResult res = pricingEngine.calculate(
                    item.valor(), item.vencimento(), LocalDate.now(),
                    taxaMensal, advaloremPercent, tarifaBoleto,
                    iofFixo, iofDiario, floatBancario, tarifasCustomizadas);

            Sacado sacado = upsertSacado(item.sacado());
            results.add(new ItemResult(item, res, sacado));

            totalBruto = totalBruto.add(item.valor());
            totalLiquido = totalLiquido.add(res.valorLiquido());
            totalDesagio = totalDesagio.add(res.valorDesconto());
            totalAdvalorem = totalAdvalorem.add(res.valorAdvalorem());
            totalIof = totalIof.add(res.valorIofTotal());
            totalTarifas = totalTarifas.add(res.valorTarifasCustomizadas().add(tarifaBoleto));
        }

        // --- Persist Bordero + Titulos when cedente is resolved ---
        System.out.println("[BORDERO] Persistência: cedente=" + (cedente != null) + ", items=" + results.size());
        if (cedente != null && !results.isEmpty()) {
            String numeroBordero = "BDR-"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + String.valueOf(System.nanoTime()).substring(8);

            Bordero bordero = new Bordero();
            bordero.setNumeroBordero(numeroBordero);
            bordero.setCedente(cedente);
            bordero.setValorFaceTotal(totalBruto);
            bordero.setDesagioTotal(totalDesagio);
            bordero.setIofTotal(totalIof);
            bordero.setTarifasTotal(totalTarifas);
            bordero.setValorLiquidoTotal(totalLiquido);
            borderoRepository.save(bordero);

            for (ItemResult ir : results) {
                Titulo titulo = new Titulo();
                titulo.setNumeroDocumento(ir.item().numero());
                titulo.setCedente(cedente);
                titulo.setSacado(ir.sacado());
                titulo.setBordero(bordero);
                titulo.setValorFace(ir.item().valor());
                titulo.setValorLiquidoAlocado(ir.calc().valorLiquido());
                titulo.setDataEmissao(ir.item().dataEmissao() != null ? ir.item().dataEmissao() : LocalDate.now());
                titulo.setDataVencimento(ir.item().vencimento());
                titulo.setDataVencimentoAjustada(ir.calc().vencimentoAjustado());
                tituloRepository.save(titulo);
            }
        }

        // --- Generate and return PDF ---
        return buildPdf(results, cnpjCedente, tarifaBoleto,
                totalBruto, totalLiquido, totalDesagio, totalAdvalorem, totalIof, totalTarifas);
    }

    /**
     * Upsert Sacado.
     * The frontend may send either a 14-digit CNPJ or a free-text name from the
     * XML.
     * - If CNPJ: lookup by cnpjCpf, create if missing.
     * - If name: lookup by razaoSocial, create with a provisional hash-CNPJ if
     * missing.
     */
    private Sacado upsertSacado(String input) {
        if (input == null || input.isBlank())
            input = "SACADO_DESCONHECIDO";
        final String value = input.trim();
        final boolean isCnpj = value.matches("\\d{14}");

        if (isCnpj) {
            return sacadoRepository.findByCnpjCpf(value).orElseGet(() -> {
                Sacado s = new Sacado();
                s.setRazaoSocial("Sacado " + value); // placeholder name
                s.setCnpjCpf(value);
                s.setLimiteCredito(BigDecimal.ZERO);
                return sacadoRepository.save(s);
            });
        } else {
            return sacadoRepository.findByRazaoSocial(value).orElseGet(() -> {
                String provisionalCnpj = String.format("%014d",
                        Math.abs((long) value.hashCode()) % 100_000_000_000_000L);
                return sacadoRepository.findByCnpjCpf(provisionalCnpj).orElseGet(() -> {
                    Sacado s = new Sacado();
                    s.setRazaoSocial(value);
                    s.setCnpjCpf(provisionalCnpj);
                    s.setLimiteCredito(BigDecimal.ZERO);
                    return sacadoRepository.save(s);
                });
            });
        }
    }

    // ---- PDF rendering -------------------------------------------------------

    private byte[] buildPdf(List<ItemResult> results, String cnpjCedente, BigDecimal tarifaBoleto,
            BigDecimal totalBruto, BigDecimal totalLiquido, BigDecimal totalDesagio,
            BigDecimal totalAdvalorem, BigDecimal totalIof, BigDecimal totalTarifas) {

        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
            Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            Paragraph title = new Paragraph("IA369 GFACTOR - BORDERÔ DE AQUISIÇÃO DE DIREITOS", headerFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            if (results.isEmpty()) {
                document.add(new Paragraph("ERRO: Nenhum item recebido para processamento.", subHeaderFont));
                document.close();
                return out.toByteArray();
            }

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.addCell(createNoBorderCell(
                    "Data da Operação: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")),
                    subHeaderFont));
            infoTable.addCell(createNoBorderCell(
                    "Cedente: " + (cnpjCedente != null ? formatCnpj(cnpjCedente) : "N/A"), subHeaderFont));
            document.add(infoTable);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(12);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 1f, 2.5f, 1.5f, 1.5f, 1.5f, 1f, 2.5f, 2f, 2f, 2f, 2f, 2.5f });
            addTableHeader(table, tableHeaderFont);

            for (ItemResult ir : results) {
                table.addCell(createCell(ir.item().numero(), tableBodyFont));
                table.addCell(createCell(ir.item().sacado(), tableBodyFont));
                table.addCell(createCell(
                        ir.item().dataEmissao() != null ? ir.item().dataEmissao().format(dtf) : "N/A", tableBodyFont));
                table.addCell(createCell(ir.item().vencimento().format(dtf), tableBodyFont));
                table.addCell(createCell(ir.calc().vencimentoAjustado().format(dtf), tableBodyFont));
                table.addCell(createCell(String.valueOf(ir.calc().prazoEfetivo()), tableBodyFont));
                table.addCell(createCell(formatMoney(ir.item().valor()), tableBodyFont));
                table.addCell(createCell(formatMoney(ir.calc().valorDesconto()), tableBodyFont));
                table.addCell(createCell(formatMoney(ir.calc().valorAdvalorem()), tableBodyFont));
                table.addCell(createCell(formatMoney(ir.calc().valorIofTotal()), tableBodyFont));
                table.addCell(
                        createCell(formatMoney(ir.calc().valorTarifasCustomizadas().add(tarifaBoleto)), tableBodyFont));
                table.addCell(createCell(formatMoney(ir.calc().valorLiquido()), tableBodyFont));
            }

            document.add(table);
            document.add(new Paragraph(" "));

            PdfPTable summary = new PdfPTable(2);
            summary.setWidthPercentage(40);
            summary.setHorizontalAlignment(Element.ALIGN_RIGHT);
            addSummaryRow(summary, "Total Bruto:", formatMoney(totalBruto), subHeaderFont);
            addSummaryRow(summary, "Total Deságio:", formatMoney(totalDesagio), subHeaderFont);
            addSummaryRow(summary, "Total Advalorem:", formatMoney(totalAdvalorem), subHeaderFont);
            addSummaryRow(summary, "Total IOF:", formatMoney(totalIof), subHeaderFont);
            addSummaryRow(summary, "Total Tarifas:", formatMoney(totalTarifas), subHeaderFont);
            addSummaryRow(summary, "VALOR LÍQUIDO:", formatMoney(totalLiquido), headerFont);
            document.add(summary);

            document.add(new Paragraph(" "));
            Font declarationFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Paragraph declaration = new Paragraph(
                    "O Cedente abaixo assinado declara expressamente, para todos os fins de direito, que os títulos " +
                            "descritos neste borderô são legítimos, originários de transações mercantis efetivas ou prestação "
                            +
                            "de serviços reais, assumindo a responsabilidade civil e criminal por quaisquer irregularidades ou "
                            +
                            "vícios ocultos. Cedemos e transferimos estes créditos, sem reservas, à IA369 GFACTOR.",
                    declarationFont);
            declaration.setAlignment(Element.ALIGN_JUSTIFIED);
            document.add(declaration);

            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            PdfPTable signatureTable = new PdfPTable(2);
            signatureTable.setWidthPercentage(100);
            PdfPCell c1 = createNoBorderCell(
                    "_________________________________________\nCEDENTE (FATURIZADA)\n"
                            + (cnpjCedente != null ? formatCnpj(cnpjCedente) : "N/A"),
                    subHeaderFont);
            c1.setHorizontalAlignment(Element.ALIGN_CENTER);
            PdfPCell c2 = createNoBorderCell(
                    "_________________________________________\nCESSIONÁRIO (FATURIZADORA)\nIA369 GFACTOR",
                    subHeaderFont);
            c2.setHorizontalAlignment(Element.ALIGN_CENTER);
            signatureTable.addCell(c1);
            signatureTable.addCell(c2);
            document.add(signatureTable);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    private void addTableHeader(PdfPTable table, Font font) {
        for (String h : new String[] { "Título", "Sacado", "Emissão", "Venc.", "Venc. Adj.",
                "Prazo", "V. Face", "Deságio", "Adval.", "IOF", "Tarifas", "Líquido" }) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell createNoBorderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font font) {
        table.addCell(createNoBorderCell(label, font));
        PdfPCell valueCell = createNoBorderCell(value, font);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private String formatMoney(BigDecimal val) {
        if (val == null)
            return "R$ 0,00";
        return java.text.NumberFormat.getCurrencyInstance(java.util.Locale.forLanguageTag("pt-BR")).format(val);
    }

    private String formatCnpj(String cnpj) {
        if (cnpj == null || cnpj.replaceAll("\\D", "").length() != 14)
            return cnpj;
        String d = cnpj.replaceAll("\\D", "");
        return d.substring(0, 2) + "." + d.substring(2, 5) + "." + d.substring(5, 8)
                + "/" + d.substring(8, 12) + "-" + d.substring(12, 14);
    }

    public record BorderoItemRequest(
            String numero,
            String sacado,
            BigDecimal valor,
            LocalDate vencimento,
            LocalDate dataEmissao) {
    }
}
