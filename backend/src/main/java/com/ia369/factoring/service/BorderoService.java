package com.ia369.factoring.service;

import com.ia369.factoring.model.TarifaCustomizada;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BorderoService {

    private final PricingEngine pricingEngine;
    private final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public BorderoService(PricingEngine pricingEngine) {
        this.pricingEngine = pricingEngine;
    }

    public byte[] generateBorderoPdf(List<BorderoItemRequest> items,
            String cnpjCedente,
            BigDecimal taxaMensal,
            BigDecimal advaloremPercent,
            BigDecimal tarifaBoleto,
            BigDecimal iofFixo,
            BigDecimal iofDiario,
            int floatBancario,
            List<TarifaCustomizada> tarifasCustomizadas) {

        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font styles
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
            Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            // Title
            Paragraph title = new Paragraph("IA369 GFACTOR - BORDERÔ DE AQUISIÇÃO DE DIREITOS", headerFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            if (items == null || items.isEmpty()) {
                document.add(new Paragraph("ERRO: Nenhum item recebido para processamento.", subHeaderFont));
                document.close();
                return out.toByteArray();
            }

            // Header Info
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.addCell(createNoBorderCell(
                    "Data da Operação: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")),
                    subHeaderFont));
            infoTable.addCell(
                    createNoBorderCell("Cedente: " + (cnpjCedente != null ? formatCnpj(cnpjCedente) : "N/A"),
                            subHeaderFont));
            document.add(infoTable);
            document.add(new Paragraph(" "));

            // Titles Table
            PdfPTable table = new PdfPTable(12);
            table.setWidthPercentage(100);
            // Adjusted widths: Título(1f), Sacado(2.5f), Emissão(1.5f), Venc(1.5f),
            // VencAdj(1.5f), Prazo(1f), V.Face(2.5f), Desagio(2f), Adval(2f), IOF(2f),
            // Tarifas(2f), Líquido(2.5f)
            float[] widths = { 1f, 2.5f, 1.5f, 1.5f, 1.5f, 1f, 2.5f, 2f, 2f, 2f, 2f, 2.5f };
            table.setWidths(widths);

            addTableHeader(table, tableHeaderFont);

            BigDecimal totalBruto = BigDecimal.ZERO;
            BigDecimal totalLiquido = BigDecimal.ZERO;
            BigDecimal totalDesagio = BigDecimal.ZERO;
            BigDecimal totalAdvalorem = BigDecimal.ZERO;
            BigDecimal totalTarifas = BigDecimal.ZERO;
            BigDecimal totalIof = BigDecimal.ZERO;

            for (BorderoItemRequest item : items) {
                PricingEngine.CalculationResult res = pricingEngine.calculate(
                        item.valor(),
                        item.vencimento(),
                        LocalDate.now(),
                        taxaMensal,
                        advaloremPercent,
                        tarifaBoleto,
                        iofFixo,
                        iofDiario,
                        floatBancario,
                        tarifasCustomizadas);

                table.addCell(createCell(item.numero(), tableBodyFont));
                table.addCell(createCell(item.sacado(), tableBodyFont));
                table.addCell(
                        createCell(item.dataEmissao() != null ? item.dataEmissao().format(dtf) : "N/A", tableBodyFont));
                table.addCell(createCell(item.vencimento().format(dtf), tableBodyFont));
                table.addCell(createCell(res.vencimentoAjustado().format(dtf), tableBodyFont));
                table.addCell(createCell(String.valueOf(res.prazoEfetivo()), tableBodyFont));
                table.addCell(createCell(formatMoney(item.valor()), tableBodyFont));
                table.addCell(createCell(formatMoney(res.valorDesconto()), tableBodyFont));
                table.addCell(createCell(formatMoney(res.valorAdvalorem()), tableBodyFont));
                table.addCell(createCell(formatMoney(res.valorIofTotal()), tableBodyFont));
                table.addCell(createCell(formatMoney(res.valorTarifasCustomizadas().add(tarifaBoleto)), tableBodyFont));
                table.addCell(createCell(formatMoney(res.valorLiquido()), tableBodyFont));

                totalBruto = totalBruto.add(item.valor());
                totalLiquido = totalLiquido.add(res.valorLiquido());
                totalDesagio = totalDesagio.add(res.valorDesconto());
                totalAdvalorem = totalAdvalorem.add(res.valorAdvalorem());
                totalIof = totalIof.add(res.valorIofTotal());
                totalTarifas = totalTarifas.add(res.valorTarifasCustomizadas().add(tarifaBoleto));
            }

            document.add(table);
            document.add(new Paragraph(" "));

            // Financial Summary
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

            // Item 5: Legal Declarations
            document.add(new Paragraph(" "));
            Font declarationFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            String legalText = "O Cedente abaixo assinado declara expressamente, para todos os fins de direito, que os títulos descritos neste borderô são legítimos, originários de transações mercantis efetivas ou prestação de serviços reais, assumindo a responsabilidade civil e criminal por quaisquer irregularidades ou vícios ocultos. Cedemos e transferimos estes créditos, sem reservas, à IA369 GFACTOR.";
            Paragraph declaration = new Paragraph(legalText, declarationFont);
            declaration.setAlignment(Element.ALIGN_JUSTIFIED);
            document.add(declaration);

            // Item 6: Signatures
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            PdfPTable signatureTable = new PdfPTable(2);
            signatureTable.setWidthPercentage(100);

            PdfPCell c1 = createNoBorderCell("_________________________________________\nCEDENTE (FATURIZADA)\n"
                    + (cnpjCedente != null ? formatCnpj(cnpjCedente) : "N/A"), subHeaderFont);
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
        String[] headers = { "Título", "Sacado", "Emissão", "Venc.", "Venc. Adj.", "Prazo", "V. Face", "Deságio",
                "Adval.", "IOF", "Tarifas", "Líquido" };
        for (String h : headers) {
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
        java.text.NumberFormat nf = java.text.NumberFormat
                .getCurrencyInstance(java.util.Locale.forLanguageTag("pt-BR"));
        return nf.format(val);
    }

    private String formatCnpj(String cnpj) {
        if (cnpj == null || cnpj.replaceAll("\\D", "").length() != 14) {
            return cnpj;
        }
        String digits = cnpj.replaceAll("\\D", "");
        return digits.substring(0, 2) + "." + digits.substring(2, 5) + "." + digits.substring(5, 8) + "/" +
                digits.substring(8, 12) + "-" + digits.substring(12, 14);
    }

    public record BorderoItemRequest(
            String numero,
            String sacado,
            BigDecimal valor,
            LocalDate vencimento,
            LocalDate dataEmissao) {
    }
}
