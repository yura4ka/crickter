package services

import "database/sql"

func ToNullString(s *string) sql.NullString {
	if s == nil || len(*s) == 0 {
		return sql.NullString{}
	}
	return sql.NullString{
		String: *s,
		Valid:  true,
	}
}
