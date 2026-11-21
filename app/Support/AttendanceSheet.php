<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Excel workbook in the unit's sheet format:
 * NR | SURNAME | FIRSTNAME | MI | 1 … 15 | TOTAL, colored per status.
 * One "All" sheet, then one sheet per platoon.
 */
class AttendanceSheet
{
    private const HEADER   = 'C6E0B4';
    private const PRESENT  = '00B050';
    private const LATE     = 'FFC000';
    private const EXCUSED  = '0070C0';
    private const ABSENT   = 'FF0000';
    private const BLANK    = 'FFF2CC';
    private const DROPPED  = 'FF0000';

    public static function build(): Spreadsheet
    {
        ['sessions' => $sessions, 'rows' => $rows] = AttendanceReport::build();

        $book = new Spreadsheet();
        $book->getProperties()->setTitle('LE 1: Attendance')->setCreator('USeP ROTC Attendance System');
        $book->removeSheetByIndex(0);

        self::addSheet($book, 'All', $rows, $sessions);

        $byPlatoon = $rows->groupBy(fn ($r) => $r['platoon'] ?: 'Unassigned')->sortKeys();
        foreach ($byPlatoon as $platoon => $platoonRows) {
            self::addSheet($book, (string) $platoon, $platoonRows->values(), $sessions);
        }

        $book->setActiveSheetIndex(0);

        return $book;
    }

    private static function addSheet(Spreadsheet $book, string $title, Collection $rows, Collection $sessions): void
    {
        $sheet   = new Worksheet($book, self::sheetTitle($title));
        $book->addSheet($sheet);

        $points   = config('rotc.points');
        $columns  = AttendanceReport::columnCount($sessions);
        $firstCol = 5; // E
        $totalCol = $firstCol + $columns;
        $lastCol  = Coordinate::stringFromColumnIndex($totalCol);
        $max      = $columns * max($points);

        // Header
        $headers = ['NR', 'SURNAME', 'FIRSTNAME', 'MI'];
        foreach ($headers as $i => $h) {
            $sheet->setCellValue([$i + 1, 1], $h);
        }
        for ($c = 0; $c < $columns; $c++) {
            $cell = [$firstCol + $c, 1];
            $sheet->setCellValue($cell, $c + 1);
            if ($s = $sessions->get($c)) {
                $date = $s['date'] ? Carbon::parse($s['date'])->format('M d, Y') : '';
                $sheet->getComment(Coordinate::stringFromColumnIndex($firstCol + $c) . '1')
                    ->getText()->createTextRun(trim("{$date}\n" . ucfirst((string) $s['type']) . "\n" . $s['name']));
            }
        }
        $sheet->setCellValue([$totalCol, 1], "TOTAL ({$max})");

        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font'      => ['bold' => true],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Rows (sorted by surname, numbered per sheet)
        $sorted = $rows->sortBy(fn ($r) => mb_strtolower($r['last_name'] . ' ' . $r['first_name']))->values();

        foreach ($sorted as $i => $r) {
            $row     = $i + 2;
            $dropped = $r['status'] === 'dropped';

            $sheet->setCellValue([1, $row], $i + 1);
            $sheet->setCellValue([2, $row], $r['last_name']);
            $sheet->setCellValue([3, $row], $r['first_name']);
            $sheet->setCellValue([4, $row], $r['middle_initial']);

            if ($dropped) {
                $sheet->getStyle("A{$row}:D{$row}")->getFont()->setBold(true)->getColor()->setRGB(self::DROPPED);
            }

            for ($c = 0; $c < $columns; $c++) {
                $s     = $sessions->get($c);
                $coord = Coordinate::stringFromColumnIndex($firstCol + $c) . $row;
                $val   = $s ? ($r['matrix'][$s['session_id']] ?? '') : '';

                if ($val === '') {
                    // After a drop: pale yellow, like the official sheet.
                    if ($dropped && $s && $r['dropped_at'] && $s['date'] > $r['dropped_at']) {
                        self::fill($sheet, $coord, self::BLANK);
                    }
                    continue;
                }

                $sheet->setCellValue($coord, $val);
                self::fill($sheet, $coord, match (true) {
                    $val === 'A'                => self::ABSENT,
                    $val === $points['present'] => self::PRESENT,
                    $val === $points['excused'] => self::EXCUSED,
                    default                     => self::LATE,
                });
            }

            $from = Coordinate::stringFromColumnIndex($firstCol);
            $to   = Coordinate::stringFromColumnIndex($totalCol - 1);
            $sheet->setCellValue([$totalCol, $row], "=SUM({$from}{$row}:{$to}{$row})");
            $sheet->getStyle("{$lastCol}{$row}")->getFont()->setBold(true);
        }

        $lastRow = max(1, $sorted->count() + 1);

        $sheet->getStyle("A1:{$lastCol}{$lastRow}")->applyFromArray([
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            'font'      => ['name' => 'Arial', 'size' => 11],
        ]);
        $sheet->getStyle('A2:A' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle(Coordinate::stringFromColumnIndex($firstCol) . "2:{$lastCol}{$lastRow}")
            ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Legend
        $legendRow = $lastRow + 2;
        $legend    = [
            ['Present', $points['present'], self::PRESENT],
            ['Late', $points['late'], self::LATE],
            ['Excused', $points['excused'], self::EXCUSED],
            ['Absent (A)', $points['absent'], self::ABSENT],
        ];
        foreach ($legend as $i => [$label, $pts, $color]) {
            $r = $legendRow + $i;
            $sheet->setCellValue("B{$r}", $label);
            $sheet->setCellValue("C{$r}", $pts);
            self::fill($sheet, "C{$r}", $color);
        }
        $sheet->setCellValue('B' . ($legendRow + 5), 'Dropped cadets are in red; sessions after the drop are left blank.');

        // Layout
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(18);
        $sheet->getColumnDimension('C')->setWidth(24);
        $sheet->getColumnDimension('D')->setWidth(5);
        for ($c = $firstCol; $c < $totalCol; $c++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($c))->setWidth(6.5);
        }
        $sheet->getColumnDimension($lastCol)->setWidth(13);
        $sheet->freezePane('E2');
    }

    private static function fill(Worksheet $sheet, string $coord, string $rgb): void
    {
        $sheet->getStyle($coord)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($rgb);
    }

    /** Excel sheet names: max 31 chars, no : \ / ? * [ ]. */
    private static function sheetTitle(string $title): string
    {
        return mb_substr(preg_replace('/[:\\\\\/\?\*\[\]]/', '-', $title) ?: 'Sheet', 0, 31);
    }
}
