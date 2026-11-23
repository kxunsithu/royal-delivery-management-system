<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class DatabaseDate
{
    /**
     * SQL expression that formats a date/timestamp column as "YYYY-MM".
     *
     * Kept database-agnostic so the same query works on SQLite (local/tests)
     * and PostgreSQL (production).
     */
    public static function month(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => "TO_CHAR({$column}, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', {$column})",
            'sqlsrv' => "FORMAT({$column}, 'yyyy-MM')",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        };
    }

    /**
     * SQL expression that extracts the date ("YYYY-MM-DD") from a column.
     */
    public static function day(string $column): string
    {
        return "DATE({$column})";
    }
}
