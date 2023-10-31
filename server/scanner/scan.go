package scanner

import (
	"errors"
	"reflect"
)

var ErrNotPointer = errors.New("given value is not a pointer")
var ErrNotStruct = errors.New("given value is not a struct")

type cleaner interface {
	SqlClean()
}

type sqlRow interface {
	Scan(...any) error
}

type sqlRows interface {
	Scan(...any) error
	Next() bool
	Close() error
}

func getContained(i interface{}) reflect.Value {
	v := reflect.ValueOf(i)

	if v.Kind() != reflect.Ptr {
		panic(ErrNotPointer)
	}

	for v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	return v
}

func getFields(i interface{}) []interface{} {
	result := make([]interface{}, 0)
	v := getContained(i)

	if v.Kind() != reflect.Struct {
		panic(ErrNotStruct)
	}

	t := reflect.TypeOf(v.Interface())

	for i := 0; i < v.NumField(); i++ {
		if _, ok := t.Field(i).Tag.Lookup("noscan"); ok {
			continue
		}

		f := v.Field(i)

		if f.Type().Kind() == reflect.Struct {
			nested := getFields(f.Addr().Interface())
			result = append(result, nested...)
			continue
		}

		if f.Type().Kind() == reflect.Ptr {
			if f.IsNil() {
				nv := reflect.New(t.Field(i).Type.Elem())
				f.Set(nv)
			}

			e := f.Elem()
			if e.Kind() == reflect.Struct {
				nested := getFields(f.Interface())
				result = append(result, nested...)
				continue
			}
		}

		result = append(result, f.Addr().Interface())
	}

	return result
}

func clean(i interface{}) {
	c, ok := i.(cleaner)
	if ok {
		c.SqlClean()
	}
	v := reflect.ValueOf(i).Elem()

	for i := 0; i < v.NumField(); i++ {
		f := v.Field(i)
		c, ok := f.Interface().(cleaner)
		if ok && !f.IsNil() {
			clean(c)
		}
	}
}

func Scan(row sqlRow, dest ...interface{}) error {
	fields := make([]interface{}, 0)

	for _, i := range dest {
		v := getContained(i)
		if v.Kind() == reflect.Struct {
			fields = append(fields, getFields(i)...)
		} else {
			fields = append(fields, i)
		}
	}

	err := row.Scan(fields...)
	if err != nil {
		return err
	}

	for _, i := range dest {
		clean(i)
	}
	return nil
}

func ScanRows[T any](dest []T, rows sqlRows) ([]T, error) {
	defer rows.Close()

	for rows.Next() {
		var temp T

		err := Scan(rows, &temp)
		if err != nil {
			return nil, err
		}

		dest = append(dest, temp)
	}

	return dest, nil
}
